import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMyNotifications,
  getMyUnreadCount,
  markOneRead,
  markAllRead,
} from "../controllers/notificationController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", getMyNotifications);
router.get("/unread-count", getMyUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:notificationId/read", markOneRead);

export default router;
