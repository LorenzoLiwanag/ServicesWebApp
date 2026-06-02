import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMyNotifications,
  getMyDeletedNotifications,
  getMyUnreadCount,
  markOneRead,
  markAllRead,
  deleteOneNotification,
  deleteAllNotifications,
  permanentlyDeleteOneNotification,
  permanentlyDeleteAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", getMyNotifications);
router.get("/deleted", getMyDeletedNotifications);
router.get("/unread-count", getMyUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/delete-all", deleteAllNotifications);
router.patch("/:notificationId/read", markOneRead);
router.patch("/:notificationId/delete", deleteOneNotification);
router.delete("/deleted", permanentlyDeleteAllNotifications);
router.delete("/:notificationId", permanentlyDeleteOneNotification);

export default router;
