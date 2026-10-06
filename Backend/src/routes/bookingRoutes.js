import express from "express";
import rateLimit from "express-rate-limit";
import {
  submitBooking,
  getMyClientBookings,
  getMyProviderBookings,
  respondToBooking,
  cancelBooking,
  getCancelPreview,
  markBookingWorkDone,
  confirmBookingDone,
  reportProblem,
} from "../controllers/bookingController.js";
import { parseDepositUpload, submitDeposit } from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

router.post("/", requireAuth, bookingLimiter, submitBooking);
router.get("/client", requireAuth, getMyClientBookings);
router.get("/provider", requireAuth, getMyProviderBookings);
router.patch("/:bookingId/respond", requireAuth, respondToBooking);
router.get("/:bookingId/cancel-preview", requireAuth, getCancelPreview);
router.patch("/:bookingId/cancel", requireAuth, cancelBooking);
router.post("/:bookingId/deposit", requireAuth, parseDepositUpload, submitDeposit);
router.patch("/:bookingId/work-done", requireAuth, markBookingWorkDone);
router.patch("/:bookingId/confirm-done", requireAuth, confirmBookingDone);
router.patch("/:bookingId/report", requireAuth, reportProblem);

export default router;
