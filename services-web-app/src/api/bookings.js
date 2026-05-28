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

export const respondToBooking = async (bookingId, { status, responseMessage }) => {
  const res = await fetch(`${API}/api/bookings/${bookingId}/respond`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, responseMessage }),
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to update booking");
  return data.booking;
};

export const cancelBooking = async (bookingId) => {
  const res = await fetch(`${API}/api/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to cancel booking");
  return data.booking;
};
