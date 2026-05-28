import express from "express";
import {
  submitBooking,
  getMyClientBookings,
  getMyProviderBookings,
  respondToBooking,
  cancelBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

// Client — submit a booking request
router.post("/", submitBooking);

// Client — view own booking requests (filter by ?status=pending|accepted|etc.)
router.get("/client", getMyClientBookings);

// Provider — view incoming booking requests
router.get("/provider", getMyProviderBookings);

// Provider — accept, decline, or complete a booking
router.patch("/:bookingId/respond", respondToBooking);

// Client — cancel a booking
router.patch("/:bookingId/cancel", cancelBooking);

export default router;
