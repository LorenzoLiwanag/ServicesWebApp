import db, { withTransaction } from "../config/Database.js";
import { httpError } from "../utils/http.js";
import { applyPenalty, settleCancellation, settleCompletion, sumsToDeposit, toCentavos } from "../utils/money.js";
import { loadBooking, transition } from "./bookingModel.js";

export const normalizeReference = (value) => {
  const ref = String(value ?? "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9-]{4,64}$/.test(ref)) throw httpError(400, "Enter the GCash reference number.");
  return ref;
};

export const normalizeGcashNumber = (value) => {
  const number = String(value ?? "").replace(/[\s-]/g, "");
  if (!/^(09\d{9}|\+639\d{9})$/.test(number)) {
    throw httpError(400, "Enter a valid GCash mobile number, e.g. 09171234567.");
  }
  return number;
};

const money = (value) => (value === null || value === undefined ? null : Number(value));

// ── Client: deposit ──────────────────────────────────────────────────────────

export const submitDeposit = async ({ bookingId, clientId, reference, gcashNumber, proofPath }) =>
  withTransaction(async (conn) => {
    const row = await loadBooking(conn, bookingId, { lock: true });
    if (row.client_id !== clientId) throw httpError(403, "Not authorized");
    if (row.status !== "accepted" || row.deposit_amount === null) {
      throw httpError(400, "This booking isn't waiting for a deposit.");
    }
    if (row.deposit_status === "submitted" || row.deposit_status === "verified") {
      throw httpError(400, "Your payment is already being verified.");
    }
    if (row.deposit_overdue) throw httpError(400, "The deposit deadline has passed.");

    const [reused] = await conn.execute(
      `SELECT id FROM booking_payment
       WHERE kind = 'deposit' AND status IN ('submitted', 'verified') AND gcash_reference = ?
       LIMIT 1`,
      [reference]
    );
    if (reused.length > 0) {
      throw httpError(400, "This GCash reference number was already used for another booking.");
    }

    await conn.execute(
      `INSERT INTO booking_payment
         (booking_request_id, kind, status, amount, gcash_reference, gcash_number, proof_path, created_by)
       VALUES (?, 'deposit', 'submitted', ?, ?, ?, ?, ?)`,
      [bookingId, row.deposit_amount, reference, gcashNumber, proofPath, clientId]
    );
  });

export const getDepositProof = async (paymentId) => {
  const [rows] = await db.execute(
    `SELECT bp.proof_path AS proofPath, br.client_id AS clientId
     FROM booking_payment bp JOIN booking_request br ON br.id = bp.booking_request_id
     WHERE bp.id = ? AND bp.kind = 'deposit' AND bp.proof_path IS NOT NULL`,
    [paymentId]
  );
  return rows[0] || null;
};

// ── Admin queues (§5.4–5.7, §7) ──────────────────────────────────────────────

const QUEUE_FROM = `
  FROM booking_request br
  JOIN provider_service ps ON ps.id = br.provider_service_id
  JOIN users c ON c.id = br.client_id
  JOIN provider_profile pp ON pp.provider_id = br.provider_id
`;

const QUEUE_COLUMNS = `
  br.id AS bookingId, br.status, br.scheduled_start AS scheduledStart,
  br.agreed_total AS agreedTotal, br.deposit_amount AS depositAmount, br.platform_fee AS platformFee,
  ps.title AS serviceTitle,
  br.client_id AS clientId, CONCAT(c.first_name, ' ', c.last_name) AS clientName, c.email AS clientEmail,
  br.provider_id AS providerId, pp.display_name AS providerName
`;

const mapQueueRow = (row) => ({
  ...row,
  agreedTotal: money(row.agreedTotal),
  depositAmount: money(row.depositAmount),
  platformFee: money(row.platformFee),
});

export const listDepositsToVerify = async () => {
  const [rows] = await db.execute(
    `SELECT ${QUEUE_COLUMNS}, bp.id AS paymentId, bp.amount, bp.gcash_reference AS gcashReference,
            bp.gcash_number AS gcashNumber, bp.created_at AS submittedAt, br.deposit_due_at AS depositDueAt
     ${QUEUE_FROM}
     JOIN booking_payment bp ON bp.booking_request_id = br.id
     WHERE bp.kind = 'deposit' AND bp.status = 'submitted'
     ORDER BY bp.created_at`
  );
  return rows.map((row) => ({ ...mapQueueRow(row), amount: money(row.amount) }));
};

const lockSubmittedDeposit = async (conn, paymentId) => {
  const [rows] = await conn.execute(
    `SELECT booking_request_id AS bookingId FROM booking_payment
     WHERE id = ? AND kind = 'deposit' AND status = 'submitted' FOR UPDATE`,
    [paymentId]
  );
  if (rows.length === 0) throw httpError(404, "This deposit is no longer waiting for review.");
  return rows[0].bookingId;
};

export const verifyDeposit = async (paymentId, adminId) =>
  withTransaction(async (conn) => {
    const bookingId = await lockSubmittedDeposit(conn, paymentId);
    await conn.execute(
      `UPDATE booking_payment SET status = 'verified', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [adminId, paymentId]
    );
    await transition(conn, bookingId, "accepted", "status = 'confirmed', confirmed_at = NOW()");
    return bookingId;
  });

export const rejectDeposit = async (paymentId, adminId, reason) =>
  withTransaction(async (conn) => {
    const bookingId = await lockSubmittedDeposit(conn, paymentId);
    await conn.execute(
      `UPDATE booking_payment SET status = 'rejected', note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [reason, adminId, paymentId]
    );
    return bookingId;
  });

const PAYOUT_DUE = "br.payout_due > 0 AND br.payout_sent_at IS NULL AND br.on_hold = FALSE";
const REFUND_DUE = "br.refund_due > 0 AND br.refund_sent_at IS NULL AND br.on_hold = FALSE";

export const listPayoutsDue = async () => {
  const [rows] = await db.execute(
    `SELECT ${QUEUE_COLUMNS}, br.payout_due AS payoutDue, br.cancelled_by AS cancelledBy,
            COALESCE(br.completed_at, br.cancelled_at) AS settledAt,
            pp.gcash_name AS gcashName, pp.gcash_number AS gcashNumber, pp.penalty_balance AS penaltyBalance
     ${QUEUE_FROM}
     WHERE ${PAYOUT_DUE}
     ORDER BY settledAt`
  );
  return rows.map((row) => {
    const { send, deducted } = applyPenalty(row.payoutDue, row.penaltyBalance);
    return {
      ...mapQueueRow(row),
      payoutDue: money(row.payoutDue),
      penaltyBalance: money(row.penaltyBalance),
      amountToSend: send,
      penaltyDeducted: deducted,
    };
  });
};

export const sendPayout = async (bookingId, adminId, reference) =>
  withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT br.payout_due, br.provider_id, pp.gcash_number, pp.penalty_balance
       FROM booking_request br JOIN provider_profile pp ON pp.provider_id = br.provider_id
       WHERE br.id = ? AND ${PAYOUT_DUE} FOR UPDATE`,
      [bookingId]
    );
    if (rows.length === 0) throw httpError(404, "This payout isn't due or was already sent.");
    const row = rows[0];
    const { send, deducted } = applyPenalty(row.payout_due, row.penalty_balance);
    // Nothing to transfer when the penalty swallows the whole payout.
    const ref = send > 0 ? normalizeReference(reference) : null;

    await conn.execute(`UPDATE booking_request SET payout_sent_at = NOW() WHERE id = ?`, [bookingId]);
    if (deducted > 0) {
      await conn.execute(
        `UPDATE provider_profile SET penalty_balance = penalty_balance - ? WHERE provider_id = ?`,
        [deducted, row.provider_id]
      );
    }
    await conn.execute(
      `INSERT INTO booking_payment
         (booking_request_id, kind, status, amount, gcash_reference, gcash_number, note, created_by)
       VALUES (?, 'payout', 'sent', ?, ?, ?, ?, ?)`,
      [bookingId, send, ref, row.gcash_number,
       deducted > 0 ? `₱${deducted.toFixed(2)} cancellation penalty deducted` : null, adminId]
    );
    return { providerId: row.provider_id, amount: send, deducted };
  });

const VERIFIED_DEPOSIT_JOIN = `
  JOIN booking_payment dep ON dep.booking_request_id = br.id AND dep.kind = 'deposit' AND dep.status = 'verified'
`;

export const listRefundsDue = async () => {
  const [rows] = await db.execute(
    `SELECT ${QUEUE_COLUMNS}, br.refund_due AS refundDue, br.cancelled_by AS cancelledBy,
            COALESCE(br.cancelled_at, br.completed_at) AS settledAt, dep.gcash_number AS gcashNumber
     ${QUEUE_FROM} ${VERIFIED_DEPOSIT_JOIN}
     WHERE ${REFUND_DUE}
     ORDER BY settledAt`
  );
  return rows.map((row) => ({ ...mapQueueRow(row), refundDue: money(row.refundDue) }));
};

export const sendRefund = async (bookingId, adminId, reference) =>
  withTransaction(async (conn) => {
    const ref = normalizeReference(reference);
    const [rows] = await conn.execute(
      `SELECT br.refund_due, br.client_id, dep.gcash_number
       FROM booking_request br ${VERIFIED_DEPOSIT_JOIN}
       WHERE br.id = ? AND ${REFUND_DUE} FOR UPDATE`,
      [bookingId]
    );
    if (rows.length === 0) throw httpError(404, "This refund isn't due or was already sent.");
    const row = rows[0];
    await conn.execute(`UPDATE booking_request SET refund_sent_at = NOW() WHERE id = ?`, [bookingId]);
    await conn.execute(
      `INSERT INTO booking_payment
         (booking_request_id, kind, status, amount, gcash_reference, gcash_number, created_by)
       VALUES (?, 'refund', 'sent', ?, ?, ?, ?)`,
      [bookingId, row.refund_due, ref, row.gcash_number, adminId]
    );
    return { clientId: row.client_id, amount: Number(row.refund_due) };
  });

// ── Disputes (§7) ────────────────────────────────────────────────────────────

const OUTCOMES = {
  complete: (amounts) => ({ status: "completed", cancelledBy: null, ...settleCompletion(amounts) }),
  provider_no_show: (amounts) => ({
    status: "cancelled", cancelledBy: "provider", ...settleCancellation({ ...amounts, by: "provider", late: true }),
  }),
  customer_no_show: (amounts) => ({
    status: "cancelled", cancelledBy: "client", ...settleCancellation({ ...amounts, by: "client", late: true }),
  }),
};

export const listHolds = async () => {
  const [rows] = await db.execute(
    `SELECT ${QUEUE_COLUMNS}, br.hold_reason AS holdReason, br.held_at AS heldAt,
            IF(br.held_by = br.client_id, 'client', 'provider') AS heldByParty
     ${QUEUE_FROM}
     WHERE br.on_hold = TRUE
     ORDER BY br.held_at`
  );
  return rows.map((row) => {
    const amounts = { depositAmount: row.depositAmount, platformFee: row.platformFee };
    const outcomes = Object.fromEntries(
      Object.entries(OUTCOMES).map(([name, settle]) => [name, settle(amounts)])
    );
    return { ...mapQueueRow(row), outcomes };
  });
};

export const resolveHold = async (bookingId, adminId, { outcome, refundDue, payoutDue, platformEarned, note }) =>
  withTransaction(async (conn) => {
    const row = await loadBooking(conn, bookingId, { lock: true });
    if (!row.on_hold) throw httpError(400, "This booking is not on hold.");
    const amounts = { depositAmount: row.deposit_amount, platformFee: row.platform_fee };

    let result;
    if (OUTCOMES[outcome]) {
      result = OUTCOMES[outcome](amounts);
    } else if (outcome === "custom") {
      const cents = (v) => toCentavos(v) / 100;
      const custom = { refundDue: cents(refundDue), payoutDue: cents(payoutDue), platformEarned: cents(platformEarned) };
      if (!sumsToDeposit(custom, row.deposit_amount)) {
        throw httpError(400, `Refund, payout and platform amounts must add up to the ₱${Number(row.deposit_amount).toFixed(2)} deposit.`);
      }
      const status = custom.payoutDue > 0 ? "completed" : "cancelled";
      result = { status, cancelledBy: status === "cancelled" ? "admin" : null, penalty: 0, ...custom };
    } else {
      throw httpError(400, "Choose an outcome.");
    }

    const stampColumn = result.status === "completed" ? "completed_at" : "cancelled_at";
    await transition(conn, bookingId, row.status,
      `status = ?, ${stampColumn} = NOW(), cancelled_by = ?, refund_due = ?, payout_due = ?,
       platform_earned = ?, on_hold = FALSE, hold_resolution = ?`,
      [result.status, result.cancelledBy, result.refundDue, result.payoutDue, result.platformEarned,
       `${outcome}: ${note}`]);
    if (result.penalty > 0) {
      await conn.execute(
        `UPDATE provider_profile SET penalty_balance = penalty_balance + ? WHERE provider_id = ?`,
        [result.penalty, row.provider_id]
      );
    }
    return { ...result, clientId: row.client_id, providerId: row.provider_id };
  });
