const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

export const submitContact = async ({ name, email, message }) => {
  const res = await fetch(`${API}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send message");
  return data;
};

export const getContactSubmissions = async (token, status) => {
  const url = new URL(`${API}/api/admin/contact-submissions`);
  if (status && status !== "all") url.searchParams.set("status", status);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load submissions");
  return data;
};

export const updateContactSubmission = async (token, id, status) => {
  const res = await fetch(`${API}/api/admin/contact-submissions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update submission");
  return data;
};
