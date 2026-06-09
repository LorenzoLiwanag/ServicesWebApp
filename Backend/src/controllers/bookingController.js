import {
  createBooking,
  getClientBookings,
  getProviderBookings,
  getBookingById,
  updateBookingStatus,
} from "../models/bookingModel.js";
import {
  createNotification,
} from "../models/notificationModel.js";

const getUserId = (req) => Number(req.userId);

const notifyOnStatusChange = async (booking, status) => {
  const base = {
    bookingRequestId: booking.bookingId,
    serviceTitle: booking.serviceTitle,
  };

  if (status === "accepted") {
    await createNotification({
      userId: booking.clientId,
      bookingRequestId: booking.bookingId,
      type: "booking_accepted",
      title: "Booking accepted",
      message: `Your booking for "${booking.serviceTitle}" was accepted.`,
    });
  } else if (status === "declined") {
    await createNotification({
      userId: booking.clientId,
      bookingRequestId: booking.bookingId,
      type: "booking_declined",
      title: "Booking declined",
      message: `Your booking for "${booking.serviceTitle}" was declined.`,
    });
  } else if (status === "cancelled") {
    await createNotification({
      userId: booking.providerId,
      bookingRequestId: booking.bookingId,
      type: "booking_cancelled",
      title: "Booking cancelled",
      message: `The booking for "${booking.serviceTitle}" was cancelled.`,
    });
  } else if (status === "completed") {
    await createNotification({
      userId: booking.clientId,
      bookingRequestId: booking.bookingId,
      type: "booking_completed",
      title: "Service completed",
      message: `Your service "${booking.serviceTitle}" has been marked as completed.`,
    });
    await createNotification({
      userId: booking.providerId,
      bookingRequestId: booking.bookingId,
      type: "booking_completed",
      title: "Job completed",
      message: `The job "${booking.serviceTitle}" has been marked as completed.`,
    });
  }
};

export const submitBooking = async (req, res) => {
  try {
    const clientId = getUserId(req);
    if (!clientId) return res.status(401).json({ message: "Authentication required" });

    const { providerServiceId, providerId, requestedDate, requestedTime, scheduledStart, scheduledEnd, clientMessage } = req.body;

    if (!providerServiceId || !providerId) {
      return res.status(400).json({ message: "providerServiceId and providerId are required" });
    }

    const booking = await createBooking({
      clientId,
      providerId: Number(providerId),
      providerServiceId: Number(providerServiceId),
      requestedDate,
      requestedTime,
      scheduledStart,
      scheduledEnd,
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
    res.status(200).json({ bookings });
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
    const { status, responseMessage } = req.body;

    if (!["accepted", "declined", "completed"].includes(status)) {
      return res.status(400).json({ message: "Status must be accepted, declined, or completed" });
    }

    const booking = await updateBookingStatus(bookingId, status, responseMessage || null, providerId, "provider");

    await notifyOnStatusChange(booking, status);

    res.status(200).json({ message: "Booking updated", booking });
  } catch (err) {
    if (err.message === "Not authorized" || err.message === "Booking not found") {
      return res.status(err.message === "Booking not found" ? 404 : 403).json({ message: err.message });
    }
    if (
      err.message.startsWith("Cannot change") ||
      err.message.startsWith("Providers can only")
    ) {
      return res.status(400).json({ message: err.message });
    }
    console.error("Error responding to booking:", err);
    res.status(500).json({ message: "Failed to update booking" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const clientId = getUserId(req);
    if (!clientId) return res.status(401).json({ message: "Authentication required" });

    const bookingId = Number(req.params.bookingId);

    const booking = await updateBookingStatus(bookingId, "cancelled", null, clientId, "client");

    // Notify provider of cancellation
    await createNotification({
      userId: booking.providerId,
      bookingRequestId: booking.bookingId,
      type: "booking_cancelled",
      title: "Booking cancelled",
      message: `The booking for "${booking.serviceTitle}" was cancelled by the client.`,
    });

    res.status(200).json({ message: "Booking cancelled", booking });
  } catch (err) {
    if (err.message === "Not authorized" || err.message === "Booking not found") {
      return res.status(err.message === "Booking not found" ? 404 : 403).json({ message: err.message });
    }
    if (err.message.startsWith("Cannot cancel")) {
      return res.status(400).json({ message: err.message });
    }
    console.error("Error cancelling booking:", err);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
};
