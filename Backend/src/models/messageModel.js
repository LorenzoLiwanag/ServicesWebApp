import db from "../config/Database.js";

export const findOrCreateConversation = async (clientId, providerId, providerServiceId) => {
  const [existing] = await db.execute(
    `SELECT id FROM conversation
     WHERE client_id = ? AND provider_id = ? AND (provider_service_id <=> ?)
     LIMIT 1`,
    [clientId, providerId, providerServiceId ?? null]
  );

  if (existing.length > 0) return existing[0].id;

  const [result] = await db.execute(
    `INSERT INTO conversation (client_id, provider_id, provider_service_id)
     VALUES (?, ?, ?)`,
    [clientId, providerId, providerServiceId ?? null]
  );
  return result.insertId;
};

export const insertMessage = async (conversationId, senderId, body) => {
  const [result] = await db.execute(
    `INSERT INTO message (conversation_id, sender_id, body) VALUES (?, ?, ?)`,
    [conversationId, senderId, body]
  );
  return result.insertId;
};

export const getConversationsForUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT
       c.id                                                          AS conversationId,
       c.client_id                                                   AS clientId,
       c.provider_id                                                 AS providerId,
       c.provider_service_id                                         AS providerServiceId,
       c.updated_at                                                  AS updatedAt,
       ps.title                                                      AS serviceTitle,
       IF(c.client_id = ?, c.provider_id, c.client_id)              AS otherUserId,
       CONCAT(ou.first_name, ' ', ou.last_name)                     AS otherUserName,
       lm.body                                                       AS lastMessage,
       lm.created_at                                                 AS lastMessageAt,
       lm.sender_id                                                  AS lastSenderId,
       (SELECT COUNT(*) FROM message
        WHERE conversation_id = c.id
          AND sender_id != ?
          AND is_read = FALSE)                                        AS unreadCount
     FROM conversation c
     JOIN users ou ON ou.id = IF(c.client_id = ?, c.provider_id, c.client_id)
     LEFT JOIN provider_service ps ON ps.id = c.provider_service_id
     LEFT JOIN message lm ON lm.id = (
       SELECT id FROM message
       WHERE conversation_id = c.id
       ORDER BY created_at DESC
       LIMIT 1
     )
     WHERE c.client_id = ? OR c.provider_id = ?
     ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
    [userId, userId, userId, userId, userId]
  );
  return rows;
};

export const getConversationById = async (conversationId) => {
  const [rows] = await db.execute(
    `SELECT
       c.id                AS id,
       c.client_id         AS clientId,
       c.provider_id       AS providerId,
       c.provider_service_id AS providerServiceId,
       ps.title            AS serviceTitle,
       CONCAT(cu.first_name, ' ', cu.last_name) AS clientName,
       CONCAT(pu.first_name, ' ', pu.last_name) AS providerName
     FROM conversation c
     JOIN users cu ON cu.id = c.client_id
     JOIN users pu ON pu.id = c.provider_id
     LEFT JOIN provider_service ps ON ps.id = c.provider_service_id
     WHERE c.id = ?`,
    [conversationId]
  );
  return rows[0] ?? null;
};

export const getMessagesForConversation = async (conversationId) => {
  const [rows] = await db.execute(
    `SELECT
       m.id           AS messageId,
       m.sender_id    AS senderId,
       m.body,
       m.is_read      AS isRead,
       m.created_at   AS createdAt,
       CONCAT(u.first_name, ' ', u.last_name) AS senderName
     FROM message m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
    [conversationId]
  );
  return rows.map((r) => ({ ...r, isRead: Boolean(r.isRead) }));
};

export const markConversationRead = async (conversationId, userId) => {
  await db.execute(
    `UPDATE message SET is_read = TRUE
     WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE`,
    [conversationId, userId]
  );
};

export const touchConversation = async (conversationId) => {
  await db.execute(
    `UPDATE conversation SET updated_at = NOW() WHERE id = ?`,
    [conversationId]
  );
};
