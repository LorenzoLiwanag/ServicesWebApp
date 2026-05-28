import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProviderBookings, respondToBooking } from "../../api/bookings.js";
import "../../styles/provider-mode/providerUpcomingJobsWidget.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  return ` at ${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const ProviderUpcomingJobsWidget = ({ refreshKey }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchProviderBookings("accepted")
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleComplete = async (bookingId) => {
    setCompleting(bookingId);
    try {
      await respondToBooking(bookingId, { status: "completed" });
      showToast("Job marked as completed.");
      load();
    } catch (err) {
      showToast(err.message || "Failed to complete job.", "error");
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="upcoming-jobs-widget">
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? "#dc2626" : "linear-gradient(135deg, #0d6efd, #60a5fa)",
          color: "#fff", padding: "10px 22px", borderRadius: 12, fontWeight: 700,
          fontSize: 14, zIndex: 2000, boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
        }} role="status">{toast.msg}</div>
      )}

      <div className="widget-header">
        <h2 className="widget-title">Upcoming Jobs</h2>
        <span className="jobs-badge">{jobs.length}</span>
      </div>

      <div className="jobs-list">
        {loading ? (
          <p className="empty-state">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <p className="empty-state">No upcoming jobs scheduled</p>
        ) : (
          jobs.map((job) => (
            <div key={job.bookingId} className="job-item">
              <div className="job-info">
                <h3 className="job-service">{job.serviceTitle}</h3>
                <p className="job-client">Client: {job.clientFirstName} {job.clientLastName}</p>
                <p className="job-time">
                  {formatDate(job.requestedDate)}{formatTime(job.requestedTime)}
                </p>
                {job.clientMessage && (
                  <p style={{ fontSize: 13, color: "rgba(17,17,17,0.6)", marginTop: 4, fontStyle: "italic" }}>
                    "{job.clientMessage}"
                  </p>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                <span className="status-badge status-confirmed">✓ Confirmed</span>
                <button
                  className="btn-contact"
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                  onClick={() => navigate("/messages")}
                >
                  Messages
                </button>
                <button
                  style={{
                    fontSize: "12px", padding: "4px 10px", border: "none",
                    borderRadius: 8, background: "linear-gradient(135deg, #0d6efd, #60a5fa)",
                    color: "#fff", fontWeight: 700, cursor: "pointer",
                    opacity: completing === job.bookingId ? 0.6 : 1,
                  }}
                  onClick={() => handleComplete(job.bookingId)}
                  disabled={completing === job.bookingId}
                >
                  {completing === job.bookingId ? "Saving…" : "Mark Complete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProviderUpcomingJobsWidget;
