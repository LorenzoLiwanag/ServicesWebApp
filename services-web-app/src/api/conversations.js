const API = "http://localhost:3000";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

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
  await fetch(`${API}/api/conversations/${conversationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchNotifications = async (token) => {
  const res = await fetch(`${API}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load notifications");
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
  await fetch(`${API}/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const markAllNotificationsRead = async (token) => {
  await fetch(`${API}/api/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchAdminMessageLogs = async (token) => {
  const res = await fetch(`${API}/api/admin/message-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load message logs");
  return data.messages ?? [];
};
