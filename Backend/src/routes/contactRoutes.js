import express from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  postContact,
  getContactSubmissions,
  patchContactSubmission,
} from "../controllers/contactController.js";

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Public — no auth, but rate limited
router.post("/contact", contactLimiter, postContact);

// Admin only
router.get("/admin/contact-submissions", requireAuth, requireAdmin, getContactSubmissions);
router.patch("/admin/contact-submissions/:id", requireAuth, requireAdmin, patchContactSubmission);

export default router;
