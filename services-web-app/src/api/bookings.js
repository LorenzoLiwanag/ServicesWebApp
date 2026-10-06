const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const parseJSON = async (res) => {
  try {
    return await res.json();
  } catch {
    throw new Error(res.ok ? "Unexpected server response" : `Server error ${res.status}`);
  }
};

export const submitBooking = async ({ providerServiceId, providerId, requestedDate, requestedTime, clientMessage }) => {
  const res = await fetch(`${API}/api/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ providerServiceId, providerId, requestedDate, requestedTime, clientMessage }),
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to submit booking");
  return data.booking;
};

export const fetchClientBookings = async (status) => {
  const url = new URL(`${API}/api/bookings/client`);
  if (status) url.searchParams.set("status", status);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to load bookings");
  return data.bookings || [];
};

export const fetchProviderBookings = async (status) => {
  const url = new URL(`${API}/api/bookings/provider`);
  if (status) url.searchParams.set("status", status);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to load bookings");
  return data.bookings || [];
};

// { status, responseMessage, estimatedHours?, agreedTotal? }
export const respondToBooking = async (bookingId, body) => {
  const res = await fetch(`${API}/api/bookings/${bookingId}/respond`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to update booking");
  return data.booking;
};

const bookingAction = async (bookingId, action, { method = "PATCH", body, fallback }) => {
  const res = await fetch(`${API}/api/bookings/${bookingId}/${action}`, {
    method,
    headers: body ? authHeaders() : { Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || fallback);
  return data;
};

export const cancelBooking = async (bookingId) =>
  (await bookingAction(bookingId, "cancel", { fallback: "Failed to cancel booking" })).booking;

export const fetchCancelPreview = async (bookingId) =>
  (await bookingAction(bookingId, "cancel-preview", { method: "GET", fallback: "Failed to load cancellation details" })).preview;

export const markWorkDone = async (bookingId) =>
  (await bookingAction(bookingId, "work-done", { fallback: "Failed to mark the job as done" })).booking;

export const confirmWorkDone = async (bookingId) =>
  (await bookingAction(bookingId, "confirm-done", { fallback: "Failed to confirm the job" })).booking;

export const reportProblem = async (bookingId, reason) =>
  (await bookingAction(bookingId, "report", { body: { reason }, fallback: "Failed to report the problem" })).booking;

export const submitDeposit = async (bookingId, { screenshot, gcashReference, gcashNumber }) => {
  const form = new FormData();
  form.append("screenshot", screenshot);
  form.append("gcashReference", gcashReference);
  form.append("gcashNumber", gcashNumber);
  const res = await fetch(`${API}/api/bookings/${bookingId}/deposit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to submit payment");
  return data.booking;
};
