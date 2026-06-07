const API = "http://localhost:3000";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const parseResponse = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const requireOk = async (res, fallbackMessage) => {
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data.message || fallbackMessage);
  return data;
};

export const startConversation = async (token, providerServiceId, message) => {
  const res = await fetch(`${API}/api/conversations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ provider_service_id: providerServiceId, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send message");
  return data;
};

export const fetchConversations = async (token) => {
  const res = await fetch(`${API}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load conversations");
  return data.conversations ?? [];
};

export const fetchConversationMessages = async (token, conversationId) => {
  const res = await fetch(`${API}/api/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load messages");
  return data;
};

export const sendReply = async (token, conversationId, message) => {
  const res = await fetch(`${API}/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send reply");
  return data;
};

export const markConversationRead = async (token, conversationId) => {
  const res = await fetch(`${API}/api/conversations/${conversationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  await requireOk(res, "Failed to mark conversation read");
};

export const fetchNotifications = async (token) => {
  const res = await fetch(`${API}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load notifications");
  return data.notifications ?? [];
};

export const fetchDeletedNotifications = async (token) => {
  const res = await fetch(`${API}/api/notifications/deleted`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load deleted notifications");
  return data.notifications ?? [];
};

export const fetchUnreadCount = async (token) => {
  const res = await fetch(`${API}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) return 0;
  return data.unreadCount ?? 0;
};

export const markNotificationRead = async (token, notificationId) => {
  const res = await fetch(`${API}/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  await requireOk(res, "Failed to mark notification read");
};

export const markAllNotificationsRead = async (token) => {
  const res = await fetch(`${API}/api/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  await requireOk(res, "Failed to mark notifications read");
};

export const deleteNotification = async (token, notificationId) => {
  const res = await fetch(`${API}/api/notifications/${notificationId}/delete`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  await requireOk(res, "Failed to delete notification");
};

export const deleteAllNotifications = async (token) => {
  const res = await fetch(`${API}/api/notifications/delete-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  await requireOk(res, "Failed to delete notifications");
};

export const permanentlyDeleteNotification = async (token, notificationId) => {
  const res = await fetch(`${API}/api/notifications/${notificationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await requireOk(res, "Failed to permanently delete notification");
};

export const permanentlyDeleteAllNotifications = async (token) => {
  const res = await fetch(`${API}/api/notifications/deleted`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await requireOk(res, "Failed to permanently delete notifications");
};

export const fetchAdminMessageLogs = async (token, page = 1, limit = 25) => {
  const res = await fetch(`${API}/api/admin/message-logs?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load message logs");
  return { messages: data.messages ?? [], pagination: data.pagination };
};
