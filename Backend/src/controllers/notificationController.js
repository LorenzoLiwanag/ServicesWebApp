import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from "../models/notificationModel.js";

const getUserId = (req) => Number(req.userId || req.headers["x-user-id"]);

export const getMyNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const notifications = await getNotificationsForUser(userId);
    res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error loading notifications:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

export const getMyUnreadCount = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const count = await getUnreadCount(userId);
    res.status(200).json({ unreadCount: count });
  } catch (err) {
    console.error("Error loading unread count:", err);
    res.status(500).json({ message: "Failed to load unread count" });
  }
};

export const markOneRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const notificationId = Number(req.params.notificationId);
    const affected = await markNotificationRead(notificationId, userId);

    if (!affected) return res.status(404).json({ message: "Notification not found" });

    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification read:", err);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const count = await markAllNotificationsRead(userId);
    res.status(200).json({ message: "All notifications marked as read", count });
  } catch (err) {
    console.error("Error marking all notifications read:", err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};
