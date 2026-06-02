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
    const res = await fetch("http://localhost:3000/api/auth/me", {
      headers: { Authorization: `Bearer ${session.token}` }
    });
    if (!res.ok) {
      clearAuthSession();
    }
  } catch {
    // Network error — keep session, user may be temporarily offline
  }
};
