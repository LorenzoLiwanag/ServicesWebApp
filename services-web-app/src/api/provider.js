const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const parseJSON = async (res) => {
  try {
    return await res.json();
  } catch {
    throw new Error(res.ok ? "Unexpected server response" : `Server error ${res.status}`);
  }
};

export const fetchProviderProfile = async (token) => {
  const res = await fetch(`${API}/api/provider/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to load provider profile");
  return data.profile;
};

export const updateProviderProfile = async (token, { displayName, bio, isProviderActive }) => {
  const res = await fetch(`${API}/api/provider/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ displayName, bio, isProviderActive }),
  });
  const data = await parseJSON(res);
  if (!res.ok) throw new Error(data.message || "Failed to update provider profile");
  return data.profile;
};
