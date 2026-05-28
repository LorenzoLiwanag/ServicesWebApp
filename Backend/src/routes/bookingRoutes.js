import express from "express";
import {
  submitBooking,
  getMyClientBookings,
  getMyProviderBookings,
  respondToBooking,
  cancelBooking,
} from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, submitBooking);
router.get("/client", requireAuth, getMyClientBookings);
router.get("/provider", requireAuth, getMyProviderBookings);
router.patch("/:bookingId/respond", requireAuth, respondToBooking);
router.patch("/:bookingId/cancel", requireAuth, cancelBooking);

export default router;
