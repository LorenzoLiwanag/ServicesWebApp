import express from "express";
import {
  getMyNotifications,
  getMyUnreadCount,
  markOneRead,
  markAllRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getMyNotifications);
router.get("/unread-count", getMyUnreadCount);
router.patch("/:notificationId/read", markOneRead);
router.patch("/read-all", markAllRead);

export default router;
