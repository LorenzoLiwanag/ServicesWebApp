import {
  createBooking,
  getClientBookings,
  getProviderBookings,
  getBookingById,
  acceptBooking,
  declineBooking,
  completeLegacyBooking,
  markWorkDone,
  confirmWorkDone,
  previewCancellation,
  cancelBooking as cancelBookingModel,
  reportProblem as reportProblemModel,
} from "../models/bookingModel.js";
import { createNotification } from "../models/notificationModel.js";
import { findAllAdminIds } from "../models/userModel.js";
import { formatPeso, PLATFORM_FEE_RATE } from "../utils/money.js";
import { sendError } from "../utils/http.js";

const getUserId = (req) => Number(req.userId);

// The state change is already committed; a failed notification must not turn it into a 500.
export const notify = (userId, booking, type, title, message) =>
  createNotification({ userId, bookingRequestId: booking.bookingId, type, title, message })
    .catch((err) => console.error("Notification failed:", err));

export const notifyAdmins = async (booking, type, title, message) => {
  const adminIds = await findAllAdminIds();
  await Promise.all(adminIds.map((adminId) => notify(adminId, booking, type, title, message)));
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

export const submitBooking = async (req, res) => {
  try {
    const clientId = getUserId(req);
    if (!clientId) return res.status(401).json({ message: "Authentication required" });

    const { providerServiceId, providerId, requestedDate, requestedTime, clientMessage } = req.body;

    if (!providerServiceId || !providerId) {
      return res.status(400).json({ message: "providerServiceId and providerId are required" });
    }

    // D19: the 24h deposit and cancellation rules need a real service date and time.
    if (!DATE_RE.test(requestedDate || "") || !TIME_RE.test(requestedTime || "")) {
      return res.status(400).json({ message: "Please choose a service date and time." });
    }
    const startsAt = new Date(`${requestedDate}T${requestedTime}+08:00`);
    if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
      return res.status(400).json({ message: "Please choose a date and time in the future." });
    }

    const booking = await createBooking({
      clientId,
      providerId: Number(providerId),
      providerServiceId: Number(providerServiceId),
      requestedDate,
      requestedTime,
      clientMessage,
    });

    // Notify provider of new booking request
    await createNotification({
      userId: booking.providerId,
      bookingRequestId: booking.bookingId,
      type: "booking_created",
      title: "New booking request",
      message: `You have a new booking request for "${booking.serviceTitle}".`,
    });

    // Notify client their request was sent
    await createNotification({
      userId: clientId,
      bookingRequestId: booking.bookingId,
      type: "provider_job_pending",
      title: "Booking request sent",
      message: `Your booking request for "${booking.serviceTitle}" has been sent. Waiting for the provider to respond.`,
    });

    res.status(201).json({ message: "Booking request submitted", booking });
  } catch (err) {
    if (
      err.message === "You cannot book your own service" ||
      err.message === "You already have an active booking request for this service."
    ) {
      return res.status(400).json({ message: err.message });
    }
    if (
      err.message === "Service not found or unavailable" ||
      err.message === "This provider is not currently accepting bookings"
    ) {
      return res.status(404).json({ message: err.message });
    }
    console.error("Error submitting booking:", err);
    res.status(500).json({ message: "Failed to submit booking" });
  }
};

export const getMyClientBookings = async (req, res) => {
  try {
    const clientId = getUserId(req);
    if (!clientId) return res.status(401).json({ message: "Authentication required" });

    const { status } = req.query;
    const bookings = await getClientBookings(clientId, status || null);
    res.status(200).json({ bookings });
  } catch (err) {
    console.error("Error loading client bookings:", err);
    res.status(500).json({ message: "Failed to load bookings" });
  }
};

export const getMyProviderBookings = async (req, res) => {
  try {
    const providerId = getUserId(req);
    if (!providerId) return res.status(401).json({ message: "Authentication required" });

    const { status } = req.query;
    const bookings = await getProviderBookings(providerId, status || null);
    // Pending requests have no snapshot yet; the accept dialog previews with today's rate.
    res.status(200).json({
      bookings: bookings.map((b) => (b.status === "pending" ? { ...b, feeRate: PLATFORM_FEE_RATE } : b)),
    });
  } catch (err) {
    console.error("Error loading provider bookings:", err);
    res.status(500).json({ message: "Failed to load bookings" });
  }
};

export const respondToBooking = async (req, res) => {
  try {
    const providerId = getUserId(req);
    if (!providerId) return res.status(401).json({ message: "Authentication required" });

    const bookingId = Number(req.params.bookingId);
    const { status, responseMessage, estimatedHours, agreedTotal } = req.body;

    if (status === "accepted") {
      await acceptBooking(bookingId, providerId, { estimatedHours, agreedTotal }, responseMessage || null);
      const booking = await getBookingById(bookingId);
      notify(booking.clientId, booking, "deposit_due", "Booking accepted — deposit due",
        `Your booking for "${booking.serviceTitle}" was accepted. Pay the ${formatPeso(booking.depositAmount)} deposit to confirm it.`);
      return res.status(200).json({ message: "Booking accepted", booking });
    }

    if (status === "declined") {
      await declineBooking(bookingId, providerId, responseMessage || null);
      const booking = await getBookingById(bookingId);
      notify(booking.clientId, booking, "booking_declined", "Booking declined",
        `Your booking for "${booking.serviceTitle}" was declined.`);
      return res.status(200).json({ message: "Booking declined", booking });
    }

    if (status === "completed") {
      await completeLegacyBooking(bookingId, providerId);
      const booking = await getBookingById(bookingId);
      notify(booking.clientId, booking, "booking_completed", "Service completed",
        `Your service "${booking.serviceTitle}" has been marked as completed.`);
      return res.status(200).json({ message: "Booking completed", booking });
    }

    res.status(400).json({ message: "Status must be accepted, declined, or completed" });
  } catch (err) {
    sendError(res, err, "Failed to update booking");
  }
};

export const markBookingWorkDone = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    await markWorkDone(bookingId, getUserId(req));
    const booking = await getBookingById(bookingId);
    notify(booking.clientId, booking, "work_done", "Please confirm the job is done",
      `${booking.providerName} marked "${booking.serviceTitle}" as done. Confirm it, or report a problem within 2 days.`);
    res.status(200).json({ message: "Marked as done", booking });
  } catch (err) {
    sendError(res, err, "Failed to mark the job as done");
  }
};

export const confirmBookingDone = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    await confirmWorkDone(bookingId, getUserId(req));
    const booking = await getBookingById(bookingId);
    notify(booking.providerId, booking, "booking_completed", "Job completed",
      `The client confirmed "${booking.serviceTitle}" is done. Your ${formatPeso(booking.payoutDue)} payout is on its way.`);
    res.status(200).json({ message: "Job confirmed", booking });
  } catch (err) {
    sendError(res, err, "Failed to confirm the job");
  }
};

export const getCancelPreview = async (req, res) => {
  try {
    const preview = await previewCancellation(Number(req.params.bookingId), getUserId(req));
    res.status(200).json({ preview });
  } catch (err) {
    sendError(res, err, "Failed to load cancellation details");
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const plan = await cancelBookingModel(bookingId, getUserId(req));
    const booking = await getBookingById(bookingId);

    const otherParty = plan.by === "client" ? booking.providerId : booking.clientId;
    const refundNote = plan.refundDue > 0 ? ` A ${formatPeso(plan.refundDue)} refund will be sent to the client.` : "";
    notify(otherParty, booking, "booking_cancelled", "Booking cancelled",
      `The booking for "${booking.serviceTitle}" was cancelled by the ${plan.by}.${refundNote}`);
    if (plan.penalty > 0) {
      notify(booking.providerId, booking, "penalty_applied", "Late cancellation penalty",
        `A ${formatPeso(plan.penalty)} penalty was added for cancelling "${booking.serviceTitle}" less than 24 hours before the service. It will be deducted from your next payout.`);
    }

    res.status(200).json({ message: "Booking cancelled", booking, settlement: plan });
  } catch (err) {
    sendError(res, err, "Failed to cancel booking");
  }
};

export const reportProblem = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    if (!reason) return res.status(400).json({ message: "Please describe the problem." });
    if (reason.length > 1000) return res.status(400).json({ message: "Please keep the description under 1000 characters." });

    const party = await reportProblemModel(bookingId, getUserId(req), reason);
    const booking = await getBookingById(bookingId);
    const otherParty = party === "client" ? booking.providerId : booking.clientId;
    notify(otherParty, booking, "booking_on_hold", "Booking on hold",
      `The ${party} reported a problem with "${booking.serviceTitle}". An admin will review it; nothing moves until then.`);
    await notifyAdmins(booking, "booking_on_hold", "Booking needs review",
      `The ${party} reported a problem with booking #${booking.bookingId} ("${booking.serviceTitle}").`);

    res.status(200).json({ message: "Problem reported", booking });
  } catch (err) {
    sendError(res, err, "Failed to report the problem");
  }
};
