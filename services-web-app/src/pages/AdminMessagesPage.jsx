import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/dashboard/AdminNavbar";
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const LIMIT = 25;

  const loadPage = useCallback(async (p) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminMessageLogs(token, p, LIMIT);
      setMessages(result.messages);
      setPagination(result.pagination);
      setPage(p);
    } catch (err) {
      setError(err.message || "Failed to load message logs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!session) { navigate("/login"); return; }
    if (session.user?.role !== "admin") { navigate("/client-dashboard"); return; }
    loadPage(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="admin-messages-page">
      <AdminNavbar />

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
          <>
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

            {/* ── Pagination controls ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 24 }}>
              <button
                onClick={() => loadPage(page - 1)}
                disabled={page <= 1 || loading}
                style={{ padding: "7px 18px", borderRadius: 7, border: "1px solid #cbd5e1", background: page <= 1 ? "#f1f5f9" : "#fff", color: page <= 1 ? "#94a3b8" : "#1e3a5f", fontWeight: 600, fontSize: 13, cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                Page {page} of {totalPages}
                {pagination?.total != null && (
                  <span style={{ fontWeight: 400, color: "#64748b" }}> &nbsp;({pagination.total} total)</span>
                )}
              </span>
              <button
                onClick={() => loadPage(page + 1)}
                disabled={page >= totalPages || loading}
                style={{ padding: "7px 18px", borderRadius: 7, border: "1px solid #cbd5e1", background: page >= totalPages ? "#f1f5f9" : "#fff", color: page >= totalPages ? "#94a3b8" : "#1e3a5f", fontWeight: 600, fontSize: 13, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMessagesPage;
