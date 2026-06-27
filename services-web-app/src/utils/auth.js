const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

export const clearAuthSession = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

export const getStoredAuthSession = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user ? { user, token } : null;
  } catch {
    clearAuthSession();
    return null;
  }
};

export const getDashboardPath = (user) => {
  return user?.role === "admin" ? "/admin" : "/client-dashboard";
};

export const getUserFullName = (user) => {
  return (
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ")
  ).trim();
};

export const validateStoredSession = async () => {
  const session = getStoredAuthSession();
  if (!session) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` }
    });
    if (!res.ok) {
      clearAuthSession();
      return;
    }

    // Treat the server as the source of truth: overwrite the locally stored
    // user with the server's copy so a tampered role (e.g. localStorage edited
    // to "admin") is corrected rather than trusted.
    const data = await res.json();
    if (data?.user) {
      localStorage.setItem("user", JSON.stringify({ ...session.user, ...data.user }));
    }
  } catch {
    // Network error — keep session, user may be temporarily offline
  }
};
