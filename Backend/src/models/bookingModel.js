import db, { withTransaction } from "../config/Database.js";
import { httpError } from "../utils/http.js";
import {
  computeAmounts,
  hourlyTotal,
  settleCancellation,
  settleCompletion,
  toCentavos,
  MAX_TOTAL,
} from "../utils/money.js";

const BOOKING_SELECT = `
  SELECT
    br.id AS bookingId,
    br.status,
    br.requested_date AS requestedDate,
    br.requested_time AS requestedTime,
    br.scheduled_start AS scheduledStart,
    br.scheduled_end AS scheduledEnd,
    br.client_message AS clientMessage,
    br.provider_response_message AS providerResponseMessage,
    br.created_at AS createdAt,
    br.updated_at AS updatedAt,
    br.estimated_hours AS estimatedHours,
    br.agreed_total AS agreedTotal,
    br.fee_rate AS feeRate,
    br.platform_fee AS platformFee,
    br.deposit_amount AS depositAmount,
    br.deposit_due_at AS depositDueAt,
    br.work_done_at AS workDoneAt,
    br.cancelled_by AS cancelledBy,
    br.refund_due AS refundDue,
    br.payout_due AS payoutDue,
    br.refund_sent_at AS refundSentAt,
    br.payout_sent_at AS payoutSentAt,
    br.on_hold AS onHold,
    br.hold_reason AS holdReason,
    br.hold_resolution AS holdResolution,
    br.held_by AS heldBy,
    dep.status AS depositStatus,
    dep.note AS depositNote,
    po.amount AS payoutAmount,
    po.gcash_reference AS payoutReference,
    rf.gcash_reference AS refundReference,
    ps.id AS serviceId,
    ps.title AS serviceTitle,
    ps.pricing_type AS pricingType,
    ps.price_amount AS priceAmount,
    ps.currency,
    sc.name AS categoryName,
    c.id AS clientId,
    c.first_name AS clientFirstName,
    c.last_name AS clientLastName,
    c.email AS clientEmail,
    p.id AS providerId,
    pp.display_name AS providerName,
    pp.average_rating AS providerRating
  FROM booking_request br
  JOIN provider_service ps ON br.provider_service_id = ps.id
  LEFT JOIN service_category sc ON ps.category_id = sc.id
  JOIN users c ON br.client_id = c.id
  JOIN users p ON br.provider_id = p.id
  JOIN provider_profile pp ON br.provider_id = pp.provider_id
  LEFT JOIN booking_payment dep ON dep.id =
    (SELECT MAX(id) FROM booking_payment WHERE booking_request_id = br.id AND kind = 'deposit')
  LEFT JOIN booking_payment po ON po.id =
    (SELECT MAX(id) FROM booking_payment WHERE booking_request_id = br.id AND kind = 'payout')
  LEFT JOIN booking_payment rf ON rf.id =
    (SELECT MAX(id) FROM booking_payment WHERE booking_request_id = br.id AND kind = 'refund')
`;

const MONEY_FIELDS = [
  "priceAmount", "estimatedHours", "agreedTotal", "feeRate", "platformFee",
  "depositAmount", "refundDue", "payoutDue", "payoutAmount",
];

const mapBooking = (row) => {
  const booking = { ...row, providerRating: row.providerRating !== null ? Number(row.providerRating) : 0 };
  for (const field of MONEY_FIELDS) {
    booking[field] = row[field] !== null ? Number(row[field]) : null;
  }
  booking.onHold = Boolean(row.onHold);
  booking.balanceOnSite = booking.agreedTotal !== null
    ? (toCentavos(booking.agreedTotal) - toCentavos(booking.depositAmount)) / 100
    : null;
  return booking;
};

export const getClientBookings = async (clientId, status) => {
  const where = status
    ? `WHERE br.client_id = ? AND br.status = ?`
    : `WHERE br.client_id = ?`;
  const params = status ? [clientId, status] : [clientId];
  const [rows] = await db.execute(
    `${BOOKING_SELECT} ${where} ORDER BY br.created_at DESC`,
    params
  );
  return rows.map(mapBooking);
};

export const getProviderBookings = async (providerId, status) => {
  const where = status
    ? `WHERE br.provider_id = ? AND br.status = ?`
    : `WHERE br.provider_id = ?`;
  const params = status ? [providerId, status] : [providerId];
  const [rows] = await db.execute(
    `${BOOKING_SELECT} ${where} ORDER BY br.created_at DESC`,
    params
  );
  return rows.map(mapBooking);
};

export const getBookingById = async (bookingId) => {
  const [rows] = await db.execute(
    `${BOOKING_SELECT} WHERE br.id = ?`,
    [bookingId]
  );
  return rows.length > 0 ? mapBooking(rows[0]) : null;
};

export const createBooking = async ({
  clientId,
  providerId,
  providerServiceId,
  requestedDate,
  requestedTime,
  clientMessage,
}) => {
  // Prevent self-booking; also verify service is approved, visible, and not deleted.
  // Join the provider's account + profile so we can enforce that the provider is
  // still active/available (the frontend hides inactive providers, but the API
  // must enforce it too).
  const [serviceRows] = await db.execute(
    `SELECT ps.provider_id, u.is_active AS userActive, pp.is_provider_active AS providerActive
     FROM provider_service ps
     JOIN users u ON u.id = ps.provider_id
     LEFT JOIN provider_profile pp ON pp.provider_id = ps.provider_id
     WHERE ps.id = ? AND ps.is_deleted = FALSE AND ps.is_visible = TRUE
       AND ps.approval_status = 'approved'`,
    [providerServiceId]
  );

  if (serviceRows.length === 0) {
    throw new Error("Service not found or unavailable");
  }

  if (serviceRows[0].provider_id === clientId) {
    throw new Error("You cannot book your own service");
  }

  // Reject if the provider's account is deactivated or they have toggled
  // themselves unavailable.
  if (serviceRows[0].userActive === 0 || serviceRows[0].providerActive === 0) {
    throw new Error("This provider is not currently accepting bookings");
  }

  const [dupRows] = await db.execute(
    `SELECT id FROM booking_request
     WHERE client_id = ? AND provider_service_id = ?
       AND status IN ('pending', 'accepted', 'confirmed', 'work_done')
     LIMIT 1`,
    [clientId, providerServiceId]
  );

  if (dupRows.length > 0) {
    throw new Error("You already have an active booking request for this service.");
  }

  const [result] = await db.execute(
    `INSERT INTO booking_request
       (client_id, provider_id, provider_service_id, requested_date, requested_time,
        scheduled_start, client_message, status)
     VALUES (?, ?, ?, ?, ?, TIMESTAMP(?, ?), ?, 'pending')`,
    [
      clientId,
      providerId,
      providerServiceId,
      requestedDate,
      requestedTime,
      requestedDate,
      requestedTime,
      clientMessage || null,
    ]
  );

  return getBookingById(result.insertId);
};

// ── Lifecycle (PRD_PAYMENT_SYSTEM_V2.md §4) ──────────────────────────────────
// Every transition is a conditional UPDATE on the expected current status, so a
// user action and the background jobs can never both move the same booking.

// Raw row plus the flags the 24h rules need, computed against Manila NOW().
export const loadBooking = async (conn, bookingId, { lock = false } = {}) => {
  const [rows] = await conn.execute(
    `SELECT br.*,
       (SELECT bp.status FROM booking_payment bp
        WHERE bp.booking_request_id = br.id AND bp.kind = 'deposit'
        ORDER BY bp.id DESC LIMIT 1) AS deposit_status,
       br.scheduled_start < NOW() + INTERVAL 24 HOUR AS is_late,
       DATE(br.scheduled_start) <= CURDATE() AS service_day_reached,
       br.deposit_due_at <= NOW() AS deposit_overdue
     FROM booking_request br WHERE br.id = ? ${lock ? "FOR UPDATE" : ""}`,
    [bookingId]
  );
  if (rows.length === 0) throw httpError(404, "Booking not found");
  return rows[0];
};

// Which side of the booking this user is on; 403 if neither.
export const partyOf = (row, userId) => {
  if (row.client_id === userId) return "client";
  if (row.provider_id === userId) return "provider";
  throw httpError(403, "Not authorized");
};

const requireParty = (row, userId, party) => {
  if (partyOf(row, userId) !== party) throw httpError(403, "Not authorized");
};

const requireStatus = (row, ...statuses) => {
  if (!statuses.includes(row.status)) {
    throw httpError(400, `This booking is ${row.status.replace("_", " ")}, so that action isn't available.`);
  }
};

const requireNotOnHold = (row) => {
  if (row.on_hold) throw httpError(400, "This booking is on hold while an admin reviews a reported problem.");
};

export const transition = async (conn, bookingId, fromStatus, setSql, params = [], extraWhere = "") => {
  const [result] = await conn.execute(
    `UPDATE booking_request SET ${setSql} WHERE id = ? AND status = ? ${extraWhere}`,
    [...params, bookingId, fromStatus]
  );
  if (result.affectedRows !== 1) {
    throw httpError(409, "This booking was just updated. Refresh and try again.");
  }
};

const hasCentPrecision = (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

const resolveTotal = (row, { estimatedHours, agreedTotal }) => {
  if (row.pricing_type === "fixed") {
    if (row.price_amount === null) throw httpError(400, "This service has no listed price.");
    return { total: Number(row.price_amount), hours: null };
  }
  if (row.pricing_type === "hourly") {
    const hours = Number(estimatedHours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 999.99 || !hasCentPrecision(hours)) {
      throw httpError(400, "Enter the estimated hours (up to 2 decimal places).");
    }
    return { total: hourlyTotal(hours, row.price_amount), hours };
  }
  const total = Number(agreedTotal);
  if (!Number.isFinite(total) || !hasCentPrecision(total)) {
    throw httpError(400, "Enter the total price for this job.");
  }
  return { total, hours: null };
};

export const acceptBooking = async (bookingId, providerId, input, responseMessage) =>
  withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT br.provider_id, br.status, ps.pricing_type, ps.price_amount,
              pp.gcash_number, pp.penalty_balance,
              COALESCE(br.scheduled_start, TIMESTAMP(br.requested_date, br.requested_time)) AS start_at,
              COALESCE(br.scheduled_start, TIMESTAMP(br.requested_date, br.requested_time)) <= NOW() AS start_passed,
              LEAST(NOW() + INTERVAL 24 HOUR,
                    COALESCE(br.scheduled_start, TIMESTAMP(br.requested_date, br.requested_time))) AS due_at
       FROM booking_request br
       JOIN provider_service ps ON ps.id = br.provider_service_id
       LEFT JOIN provider_profile pp ON pp.provider_id = br.provider_id
       WHERE br.id = ? FOR UPDATE`,
      [bookingId]
    );
    if (rows.length === 0) throw httpError(404, "Booking not found");
    const row = rows[0];
    if (row.provider_id !== providerId) throw httpError(403, "Not authorized");
    requireStatus(row, "pending");
    if (!row.gcash_number) {
      throw httpError(400, "Add your GCash payout details before accepting bookings.");
    }
    if (Number(row.penalty_balance) > 0) {
      throw httpError(400, `You have an unpaid cancellation penalty of ₱${Number(row.penalty_balance).toFixed(2)}. Contact the admin to settle it before accepting new bookings.`);
    }
    if (!row.start_at) {
      throw httpError(400, "This booking has no service date. Ask the client to book again with a date and time.");
    }
    if (row.start_passed) throw httpError(400, "This booking's service date has already passed.");

    const { total, hours } = resolveTotal(row, input);
    if (total <= 0 || total > MAX_TOTAL) throw httpError(400, "The total must be more than ₱0.");
    const amounts = computeAmounts(total);

    await transition(
      conn, bookingId, "pending",
      `status = 'accepted', accepted_at = NOW(),
       provider_response_message = COALESCE(?, provider_response_message),
       scheduled_start = ?, estimated_hours = ?, agreed_total = ?, fee_rate = ?,
       platform_fee = ?, deposit_amount = ?, deposit_due_at = ?`,
      [responseMessage, row.start_at, hours, amounts.agreedTotal, amounts.feeRate,
       amounts.platformFee, amounts.depositAmount, row.due_at]
    );
  });

export const declineBooking = async (bookingId, providerId, responseMessage) => {
  const row = await loadBooking(db, bookingId);
  requireParty(row, providerId, "provider");
  requireStatus(row, "pending");
  await transition(db, bookingId, "pending",
    "status = 'declined', declined_at = NOW(), provider_response_message = COALESCE(?, provider_response_message)",
    [responseMessage]);
};

// Bookings accepted before the payment system shipped have no deposit and keep
// the old provider-driven completion (D9: no backfill).
export const completeLegacyBooking = async (bookingId, providerId) => {
  const row = await loadBooking(db, bookingId);
  requireParty(row, providerId, "provider");
  requireStatus(row, "accepted");
  if (row.deposit_amount !== null) throw httpError(400, "Use \"Mark as done\" once the deposit is confirmed.");
  await transition(db, bookingId, "accepted", "status = 'completed', completed_at = NOW()");
};

export const markWorkDone = async (bookingId, providerId) => {
  const row = await loadBooking(db, bookingId);
  requireParty(row, providerId, "provider");
  requireStatus(row, "confirmed");
  requireNotOnHold(row);
  if (!row.service_day_reached) throw httpError(400, "You can mark the job done on or after the service date.");
  await transition(db, bookingId, "confirmed", "status = 'work_done', work_done_at = NOW()", [], "AND on_hold = FALSE");
};

const completionSql = "status = 'completed', completed_at = NOW(), refund_due = 0, payout_due = ?, platform_earned = ?";
const completionParams = (row) => {
  const s = settleCompletion({ depositAmount: row.deposit_amount, platformFee: row.platform_fee });
  return [s.payoutDue, s.platformEarned];
};

export const confirmWorkDone = async (bookingId, clientId) => {
  const row = await loadBooking(db, bookingId);
  requireParty(row, clientId, "client");
  requireStatus(row, "work_done");
  requireNotOnHold(row);
  await transition(db, bookingId, "work_done", completionSql, completionParams(row), "AND on_hold = FALSE");
};

// §6. Shared by the preview and the real cancel so they can never disagree.
const planCancellation = (row, by) => {
  requireStatus(row, ...(by === "client" ? ["pending", "accepted", "confirmed"] : ["accepted", "confirmed"]));
  requireNotOnHold(row);
  if (row.deposit_status === "submitted") {
    throw httpError(400, by === "client"
      ? "Your payment is being verified — try again once it's confirmed."
      : "The client's payment is being verified — try again once it's confirmed.");
  }
  // A verified deposit moves the booking to confirmed in the same transaction.
  const paid = row.status === "confirmed";
  const late = Boolean(row.is_late);
  const settlement = paid
    ? settleCancellation({ depositAmount: row.deposit_amount, platformFee: row.platform_fee, by, late })
    : { refundDue: 0, payoutDue: 0, platformEarned: 0, penalty: 0 };
  return { by, paid, late, depositAmount: paid ? Number(row.deposit_amount) : 0, ...settlement };
};

export const previewCancellation = async (bookingId, userId) => {
  const row = await loadBooking(db, bookingId);
  return planCancellation(row, partyOf(row, userId));
};

export const cancelBooking = async (bookingId, userId) =>
  withTransaction(async (conn) => {
    const row = await loadBooking(conn, bookingId, { lock: true });
    const plan = planCancellation(row, partyOf(row, userId));
    const money = plan.paid ? [plan.refundDue, plan.payoutDue, plan.platformEarned] : [null, null, null];
    await transition(conn, bookingId, row.status,
      "status = 'cancelled', cancelled_at = NOW(), cancelled_by = ?, refund_due = ?, payout_due = ?, platform_earned = ?",
      [plan.by, ...money], "AND on_hold = FALSE");
    if (plan.penalty > 0) {
      await conn.execute(
        `UPDATE provider_profile SET penalty_balance = penalty_balance + ? WHERE provider_id = ?`,
        [plan.penalty, row.provider_id]
      );
    }
    return plan;
  });

export const reportProblem = async (bookingId, userId, reason) => {
  const row = await loadBooking(db, bookingId);
  const party = partyOf(row, userId);
  requireStatus(row, "confirmed", "work_done");
  requireNotOnHold(row);
  await transition(db, bookingId, row.status,
    "on_hold = TRUE, hold_reason = ?, held_by = ?, held_at = NOW()",
    [reason, userId], "AND on_hold = FALSE");
  return party;
};

// ── Background jobs (server.js runs these every 5 minutes) ───────────────────

// Unpaid deposits past their deadline. A deposit under review keeps the booking alive.
export const expireOverdueDeposits = async () => {
  const [rows] = await db.execute(
    `SELECT id FROM booking_request WHERE status = 'accepted' AND deposit_due_at <= NOW()`
  );
  const expired = [];
  for (const { id } of rows) {
    const [result] = await db.execute(
      `UPDATE booking_request br SET br.status = 'expired', br.expired_at = NOW()
       WHERE br.id = ? AND br.status = 'accepted' AND br.deposit_due_at <= NOW()
         AND NOT EXISTS (SELECT 1 FROM booking_payment bp
                         WHERE bp.booking_request_id = br.id AND bp.kind = 'deposit'
                           AND bp.status IN ('submitted', 'verified'))`,
      [id]
    );
    if (result.affectedRows === 1) expired.push(id);
  }
  return expired;
};

// D7: the client has 2 days to confirm or report a problem.
export const autoConfirmWorkDone = async () => {
  const stale = "AND on_hold = FALSE AND work_done_at <= NOW() - INTERVAL 48 HOUR";
  const [rows] = await db.execute(
    `SELECT id, deposit_amount, platform_fee FROM booking_request WHERE status = 'work_done' ${stale}`
  );
  const completed = [];
  for (const row of rows) {
    try {
      await transition(db, row.id, "work_done", completionSql, completionParams(row), stale);
      completed.push(row.id);
    } catch (err) {
      if (err.status !== 409) throw err; // someone else moved it first
    }
  }
  return completed;
};
