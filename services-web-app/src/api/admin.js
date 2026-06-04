const BASE_URL = "http://localhost:3000/api/admin";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
};

// ── Categories ───────────────────────────────────────────────────────────────

export const fetchCategories = async () => {
  const res = await fetch(`${BASE_URL}/categories`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load categories");
  return data.categories;
};

export const createCategory = async (body) => {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create category");
  return data;
};

export const updateCategory = async (id, body) => {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update category");
  return data;
};

export const deactivateCategory = async (id) => {
  const res = await fetch(`${BASE_URL}/categories/${id}/deactivate`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to deactivate category");
  return data;
};

export const reactivateCategory = async (id) => {
  const res = await fetch(`${BASE_URL}/categories/${id}/reactivate`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reactivate category");
  return data;
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete category");
  return data;
};

export const fetchUncategorizedServices = async () => {
  const res = await fetch(`${BASE_URL}/services/uncategorized`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load uncategorized services");
  return data.services;
};

export const assignServiceCategory = async (serviceId, categoryId) => {
  const res = await fetch(`${BASE_URL}/services/${serviceId}/assign-category`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ categoryId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to assign category");
  return data;
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
