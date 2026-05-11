import {
  findOrCreateThread,
  insertMessage,
  insertNotification,
  getThreadsForUser,
  getThreadMessages,
  markThreadRead,
} from "../models/messageModel.js";

export const postMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { recipientId, body, serviceId, bookingId } = req.body;

    if (!recipientId || !body?.trim()) {
      return res.status(400).json({ message: "recipientId and body are required" });
    }

    if (senderId === Number(recipientId)) {
      return res.status(400).json({ message: "Cannot send a message to yourself" });
    }

    const threadId = await findOrCreateThread(
      senderId,
      Number(recipientId),
      serviceId != null ? Number(serviceId) : null,
      bookingId != null ? Number(bookingId) : null
    );

    const messageId = await insertMessage(threadId, senderId, body.trim());

    await insertNotification(Number(recipientId), "new_message", {
      messageId,
      threadId,
      senderId,
    });

    res.status(201).json({ threadId, messageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

export const getThreads = async (req, res) => {
  try {
    const threads = await getThreadsForUser(req.userId);
    res.json({ threads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load threads" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const threadId = Number(req.query.thread);

    if (!threadId) {
      return res.status(400).json({ message: "thread query param is required" });
    }

    const result = await getThreadMessages(threadId, req.userId);

    if (result === null) {
      return res.status(403).json({ message: "Access denied" });
    }

    await markThreadRead(threadId, req.userId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load messages" });
  }
};
