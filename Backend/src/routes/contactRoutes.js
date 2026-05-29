import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  postContact,
  getContactSubmissions,
  patchContactSubmission,
} from "../controllers/contactController.js";

const router = express.Router();

// Public — no auth
router.post("/contact", postContact);

// Admin only
router.get("/admin/contact-submissions", requireAuth, requireAdmin, getContactSubmissions);
router.patch("/admin/contact-submissions/:id", requireAuth, requireAdmin, patchContactSubmission);

export default router;
