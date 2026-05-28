import db from "../config/Database.js";

export const createNotification = async ({
  userId,
  bookingRequestId,
  type,
  title,
  message,
  relatedEntityType,
  relatedEntityId,
}) => {
  const [result] = await db.execute(
    `INSERT INTO notification
       (user_id, booking_request_id, type, title, message, related_entity_type, related_entity_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      bookingRequestId ?? null,
      type,
      title,
      message,
      relatedEntityType ?? null,
      relatedEntityId ?? null,
    ]
  );
  return result.insertId;
};

export const getNotificationsForUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT
       id,
       user_id              AS userId,
       booking_request_id   AS bookingRequestId,
       type,
       title,
       message,
       related_entity_type  AS relatedEntityType,
       related_entity_id    AS relatedEntityId,
       is_read              AS isRead,
       created_at           AS createdAt
     FROM notification
     WHERE user_id = ?
     ORDER BY is_read ASC, created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows.map((r) => ({ ...r, isRead: Boolean(r.isRead) }));
};

export const markNotificationRead = async (notificationId, userId) => {
  const [result] = await db.execute(
    `UPDATE notification SET is_read = TRUE WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows;
};

export const markAllNotificationsRead = async (userId) => {
  const [result] = await db.execute(
    `UPDATE notification SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  return result.affectedRows;
};

export const markConversationNotificationsRead = async (conversationId, userId) => {
  await db.execute(
    `UPDATE notification
     SET is_read = TRUE
     WHERE user_id = ?
       AND related_entity_type = 'conversation'
       AND related_entity_id = ?
       AND is_read = FALSE`,
    [userId, conversationId]
  );
};

export const getUnreadCount = async (userId) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count FROM notification WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  return Number(rows[0].count);
};
