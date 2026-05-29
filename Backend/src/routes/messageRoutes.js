import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  startConversation,
  listConversations,
  getConversationMessages,
  sendReply,
  markAsRead,
} from "../controllers/messageController.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", startConversation);
router.get("/", listConversations);
router.get("/:id/messages", getConversationMessages);
router.post("/:id/messages", sendReply);
router.patch("/:id/read", markAsRead);

export default router;
