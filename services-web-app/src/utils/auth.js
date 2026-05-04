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
