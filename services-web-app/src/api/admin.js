const BASE_URL = "http://localhost:3000/api/admin";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
};

export const fetchPendingUsers = async () => {
  const res = await fetch(`${BASE_URL}/pending-users`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load pending users");
  return data.users;
};

export const approveUser = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve user");
  return data;
};

export const fetchPendingServices = async () => {
  const res = await fetch(`${BASE_URL}/pending-services`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load pending services");
  return data.services;
};

export const approveProviderService = async (serviceId) => {
  const res = await fetch(`${BASE_URL}/services/${serviceId}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve service");
  return data;
};
