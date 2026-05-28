import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import { getStoredAuthSession } from "../utils/auth.js";
import { fetchAdminMessageLogs } from "../api/conversations.js";
import "../styles/admin/adminMessages.css";

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminMessagesPage = () => {
  const navigate = useNavigate();
  const session = getStoredAuthSession();
  const token = session?.token;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) { navigate("/login"); return; }
    if (session.user?.role !== "admin") { navigate("/client-dashboard"); return; }
    fetchAdminMessageLogs(token)
      .then(setMessages)
      .catch((err) => setError(err.message || "Failed to load message logs"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="admin-messages-page">
      <DashboardNavbar />

      <div className="admin-messages-container">
        <div className="admin-messages-header">
          <h1 className="admin-messages-title">Message Logs</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Read-only view of all in-app messages.
          </p>
        </div>

        {loading && <p className="admin-loading">Loading…</p>}
        {error && <p className="admin-error">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="admin-empty">No messages sent yet.</p>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Service</th>
                  <th>Message</th>
                  <th>Sent At</th>
                  <th>Conv #</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.messageId} className="admin-row">
                    <td className="admin-cell-date">{m.messageId}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{m.senderName}</span>
                      <br />
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{m.senderEmail}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{m.receiverName}</span>
                      <br />
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{m.receiverEmail}</span>
                    </td>
                    <td>{m.serviceTitle ?? "—"}</td>
                    <td className="admin-cell-message">
                      {m.messageBody.length > 100
                        ? m.messageBody.slice(0, 100) + "…"
                        : m.messageBody}
                    </td>
                    <td className="admin-cell-date">{formatDate(m.sentAt)}</td>
                    <td style={{ color: "#64748b", fontSize: 12 }}>#{m.conversationId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessagesPage;
