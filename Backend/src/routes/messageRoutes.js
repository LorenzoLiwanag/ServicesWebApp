import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  postMessage,
  getThreads,
  getMessages,
} from "../controllers/messageController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", postMessage);
router.get("/threads", getThreads);
router.get("/", getMessages);

export default router;
