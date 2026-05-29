import db from "../config/Database.js";
import {
  findOrCreateConversation,
  insertMessage,
  getConversationsForUser,
  getConversationById,
  getMessagesForConversation,
  markConversationRead,
  touchConversation,
} from "../models/messageModel.js";
import {
  createNotification,
  markConversationNotificationsRead,
} from "../models/notificationModel.js";

// POST /api/conversations
export const startConversation = async (req, res) => {
  try {
    const senderId = req.userId;
    const { provider_service_id, message } = req.body;

    if (!provider_service_id || !message?.trim()) {
      return res.status(400).json({ message: "provider_service_id and message are required" });
    }

    const [serviceRows] = await db.execute(
      `SELECT id, provider_id, title, approval_status, is_visible, is_deleted
       FROM provider_service WHERE id = ?`,
      [Number(provider_service_id)]
    );
    const service = serviceRows[0];

    if (!service) return res.status(404).json({ message: "Service not found" });
    if (service.is_deleted) return res.status(400).json({ message: "Service is no longer available" });
    if (!service.is_visible) return res.status(400).json({ message: "Service is not visible" });
    if (service.approval_status !== "approved") {
      return res.status(400).json({ message: "Service is not approved" });
    }
    if (service.provider_id === senderId) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    const conversationId = await findOrCreateConversation(
      senderId,
      service.provider_id,
      Number(provider_service_id)
    );

    await insertMessage(conversationId, senderId, message.trim());

    const [senderRows] = await db.execute(
      `SELECT CONCAT(first_name, ' ', last_name) AS name FROM users WHERE id = ?`,
      [senderId]
    );
    const senderName = senderRows[0]?.name ?? "Someone";

    await createNotification({
      userId: service.provider_id,
      type: "message_received",
      title: "New message",
      message: `You received a new message about ${service.title}.`,
      relatedEntityType: "conversation",
      relatedEntityId: conversationId,
    });

    res.status(201).json({ conversationId, message: "Message sent successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to send message. Please try again." });
  }
};

// GET /api/conversations
export const listConversations = async (req, res) => {
  try {
    const conversations = await getConversationsForUser(req.userId);
    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load conversations" });
  }
};

// GET /api/conversations/:id/messages
export const getConversationMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const conversation = await getConversationById(conversationId);

    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.clientId !== req.userId && conversation.providerId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await getMessagesForConversation(conversationId);
    res.json({ conversation, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

// POST /api/conversations/:id/messages
export const sendReply = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message body is required" });
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.clientId !== req.userId && conversation.providerId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await insertMessage(conversationId, req.userId, message.trim());
    await touchConversation(conversationId);

    const receiverId =
      req.userId === conversation.clientId
        ? conversation.providerId
        : conversation.clientId;

    const isProviderReplying = req.userId === conversation.providerId;

    const [senderRows] = await db.execute(
      `SELECT CONCAT(first_name, ' ', last_name) AS name FROM users WHERE id = ?`,
      [req.userId]
    );
    const senderName = senderRows[0]?.name ?? "Someone";

    await createNotification({
      userId: receiverId,
      type: isProviderReplying ? "reply_received" : "message_received",
      title: isProviderReplying ? "New reply" : "New message",
      message: isProviderReplying
        ? `New reply from ${senderName}.`
        : `New message from ${senderName}.`,
      relatedEntityType: "conversation",
      relatedEntityId: conversationId,
    });

    res.status(201).json({ message: "Reply sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send reply" });
  }
};

// PATCH /api/conversations/:id/read
export const markAsRead = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const conversation = await getConversationById(conversationId);

    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (conversation.clientId !== req.userId && conversation.providerId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await markConversationRead(conversationId, req.userId);
    await markConversationNotificationsRead(conversationId, req.userId);

    res.json({ message: "Marked as read." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark as read" });
  }
};
