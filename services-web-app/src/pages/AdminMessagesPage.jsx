import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import { getStoredAuthSession } from "../utils/auth.js";
import { getContactSubmissions, updateContactSubmission } from "../api/contact.js";
import "../styles/admin/adminMessages.css";

const STATUS_OPTIONS = ["all", "new", "read", "archived"];

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

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [patching, setPatching] = useState(null);

  useEffect(() => {
    if (!session) { navigate("/login"); return; }
    if (session.user?.role !== "admin") { navigate("/client-dashboard"); return; }
    fetchSubmissions();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getContactSubmissions(token, filter);
      setSubmissions(data.submissions ?? data);
    } catch (err) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, newStatus) => {
    setPatching(id);
    try {
      await updateContactSubmission(token, id, newStatus);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    } catch {
      // keep current state on failure
    } finally {
      setPatching(null);
    }
  };

  return (
    <div className="admin-messages-page">
      <DashboardNavbar />

      <div className="admin-messages-container">
        <div className="admin-messages-header">
          <h1 className="admin-messages-title">Contact Submissions</h1>
          <select
            className="admin-status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="admin-loading">Loading…</p>}
        {error && <p className="admin-error">{error}</p>}
        {!loading && !error && submissions.length === 0 && (
          <p className="admin-empty">No submissions found.</p>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className={`admin-row admin-row--${s.status}`}>
                    <td className="admin-cell-date">{formatDate(s.created_at)}</td>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td className="admin-cell-message">
                      {s.message.length > 80
                        ? s.message.slice(0, 80) + "…"
                        : s.message}
                    </td>
                    <td>
                      <span className={`admin-status-badge admin-status-badge--${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="admin-cell-actions">
                      {s.status !== "read" && s.status !== "archived" && (
                        <button
                          className="admin-action-btn"
                          disabled={patching === s.id}
                          onClick={() => handleAction(s.id, "read")}
                        >
                          Mark as read
                        </button>
                      )}
                      {s.status !== "archived" && (
                        <button
                          className="admin-action-btn admin-action-btn--archive"
                          disabled={patching === s.id}
                          onClick={() => handleAction(s.id, "archived")}
                        >
                          Archive
                        </button>
                      )}
                    </td>
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
