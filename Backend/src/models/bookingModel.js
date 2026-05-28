import db from "../config/Database.js";

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
`;

const mapBooking = (row) => ({
  ...row,
  priceAmount: row.priceAmount !== null ? Number(row.priceAmount) : null,
  providerRating: row.providerRating !== null ? Number(row.providerRating) : 0,
});

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
  scheduledStart,
  scheduledEnd,
  clientMessage,
}) => {
  // Prevent self-booking
  const [serviceRows] = await db.execute(
    `SELECT provider_id FROM provider_service WHERE id = ? AND is_deleted = FALSE AND is_visible = TRUE`,
    [providerServiceId]
  );

  if (serviceRows.length === 0) {
    throw new Error("Service not found or unavailable");
  }

  if (serviceRows[0].provider_id === clientId) {
    throw new Error("You cannot book your own service");
  }

  const [result] = await db.execute(
    `INSERT INTO booking_request
       (client_id, provider_id, provider_service_id, requested_date, requested_time,
        scheduled_start, scheduled_end, client_message, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      clientId,
      providerId,
      providerServiceId,
      requestedDate || null,
      requestedTime || null,
      scheduledStart || null,
      scheduledEnd || null,
      clientMessage || null,
    ]
  );

  return getBookingById(result.insertId);
};

export const updateBookingStatus = async (bookingId, status, responseMessage, actorId, actorRole) => {
  const [rows] = await db.execute(
    `SELECT client_id, provider_id, status FROM booking_request WHERE id = ?`,
    [bookingId]
  );

  if (rows.length === 0) {
    throw new Error("Booking not found");
  }

  const booking = rows[0];
  const currentStatus = booking.status;

  // Authorization rules
  if (actorRole === "provider") {
    if (booking.provider_id !== actorId) {
      throw new Error("Not authorized");
    }
    if (!["accepted", "declined", "completed"].includes(status)) {
      throw new Error("Providers can only accept, decline, or complete bookings");
    }
  } else if (actorRole === "client") {
    if (booking.client_id !== actorId) {
      throw new Error("Not authorized");
    }
    if (status !== "cancelled") {
      throw new Error("Clients can only cancel bookings");
    }
    if (!["pending", "accepted"].includes(currentStatus)) {
      throw new Error("Cannot cancel a booking that is already " + currentStatus);
    }
  }

  const fields = responseMessage
    ? `status = ?, provider_response_message = ?`
    : `status = ?`;
  const params = responseMessage
    ? [status, responseMessage, bookingId]
    : [status, bookingId];

  await db.execute(`UPDATE booking_request SET ${fields} WHERE id = ?`, params);

  return getBookingById(bookingId);
};
