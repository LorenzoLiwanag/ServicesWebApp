import db from "../config/Database.js";

// Returns the thread_id for the (sender, recipient, context) pair, creating it if needed.
// participant_a is always LEAST(a,b) so the UNIQUE KEY on the table fires correctly.
export const findOrCreateThread = async (senderId, recipientId, serviceId, bookingId) => {
  const a = Math.min(senderId, recipientId);
  const b = Math.max(senderId, recipientId);
  const svc = serviceId ?? null;
  const bkg = bookingId ?? null;

  const [existing] = await db.execute(
    `SELECT thread_id FROM message_thread
     WHERE participant_a = ? AND participant_b = ?
       AND (service_id <=> ?) AND (booking_id <=> ?)
     LIMIT 1`,
    [a, b, svc, bkg]
  );

  if (existing.length > 0) return existing[0].thread_id;

  const [result] = await db.execute(
    `INSERT INTO message_thread (participant_a, participant_b, service_id, booking_id)
     VALUES (?, ?, ?, ?)`,
    [a, b, svc, bkg]
  );
  return result.insertId;
};

export const insertMessage = async (threadId, senderId, body) => {
  const [result] = await db.execute(
    `INSERT INTO message (thread_id, sender_id, body) VALUES (?, ?, ?)`,
    [threadId, senderId, body]
  );
  return result.insertId;
};

export const insertNotification = async (userId, type, payload) => {
  await db.execute(
    `INSERT INTO notification (user_id, type, payload) VALUES (?, ?, ?)`,
    [userId, type, JSON.stringify(payload)]
  );
};

export const getThreadsForUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT
       mt.thread_id    AS threadId,
       mt.service_id   AS serviceId,
       mt.booking_id   AS bookingId,
       m.body          AS lastMessage,
       m.created_at    AS lastMessageAt,
       m.sender_id     AS lastSenderId,
       u.full_name     AS otherUserName,
       u.id            AS otherUserId
     FROM message_thread mt
     JOIN message m
       ON m.message_id = (
         SELECT message_id FROM message
         WHERE thread_id = mt.thread_id
         ORDER BY created_at DESC
         LIMIT 1
       )
     JOIN users u
       ON u.id = IF(mt.participant_a = ?, mt.participant_b, mt.participant_a)
     WHERE mt.participant_a = ? OR mt.participant_b = ?
     ORDER BY m.created_at DESC`,
    [userId, userId, userId]
  );
  return rows;
};

// Returns null if the user is not a participant in the thread.
export const getThreadMessages = async (threadId, userId) => {
  const [threads] = await db.execute(
    `SELECT thread_id, participant_a, participant_b
     FROM message_thread
     WHERE thread_id = ? AND (participant_a = ? OR participant_b = ?)`,
    [threadId, userId, userId]
  );
  if (threads.length === 0) return null;

  const [messages] = await db.execute(
    `SELECT
       m.message_id  AS messageId,
       m.sender_id   AS senderId,
       m.body,
       m.is_read     AS isRead,
       m.created_at  AS createdAt,
       u.full_name   AS senderName
     FROM message m
     JOIN users u ON u.id = m.sender_id
     WHERE m.thread_id = ?
     ORDER BY m.created_at ASC`,
    [threadId]
  );

  return { thread: threads[0], messages };
};

export const markThreadRead = async (threadId, userId) => {
  await db.execute(
    `UPDATE message SET is_read = 1
     WHERE thread_id = ? AND sender_id != ?`,
    [threadId, userId]
  );
};
