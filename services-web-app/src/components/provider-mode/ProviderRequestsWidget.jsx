import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProviderBookings, respondToBooking } from "../../api/bookings.js";
import "../../styles/provider-mode/providerRequestsWidget.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  return ` at ${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const ProviderRequestsWidget = ({ onResponded }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchProviderBookings("pending")
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRespond = async (bookingId, status) => {
    setActing(bookingId);
    try {
      await respondToBooking(bookingId, { status });
      showToast(status === "accepted" ? "Booking accepted." : "Booking declined.");
      load();
      if (onResponded) onResponded();
    } catch (err) {
      showToast(err.message || "Failed to update booking.", "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="requests-widget">
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? "#dc2626" : "linear-gradient(135deg, #0d6efd, #60a5fa)",
          color: "#fff", padding: "10px 22px", borderRadius: 12, fontWeight: 700,
          fontSize: 14, zIndex: 2000, boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
        }} role="status">{toast.msg}</div>
      )}

      <div className="widget-header">
        <h2 className="widget-title">Booking Requests</h2>
        <span className="request-badge">{requests.length}</span>
      </div>

      <div className="requests-list">
        {loading ? (
          <p className="empty-state">Loading requests…</p>
        ) : requests.length === 0 ? (
          <p className="empty-state">No pending requests</p>
        ) : (
          requests.map((r) => (
            <div key={r.bookingId} className="request-item">
              <div className="request-info">
                <h3 className="request-service">{r.serviceTitle}</h3>
                <p className="request-client">From: {r.clientFirstName} {r.clientLastName}</p>
                <p className="request-datetime">
                  {formatDate(r.requestedDate)}{formatTime(r.requestedTime)}
                </p>
                {r.pricingType !== "quote" && r.priceAmount && (
                  <p className="request-budget">
                    ₱{r.priceAmount}{r.pricingType === "hourly" ? "/hr" : ""}
                  </p>
                )}
                {r.clientMessage && (
                  <p style={{ fontSize: 13, color: "rgba(17,17,17,0.6)", marginTop: 4, fontStyle: "italic" }}>
                    "{r.clientMessage}"
                  </p>
                )}
              </div>

              <div className="request-actions">
                <button
                  className="btn-accept"
                  onClick={() => handleRespond(r.bookingId, "accepted")}
                  disabled={acting === r.bookingId}
                >
                  Accept
                </button>
                <button
                  className="btn-decline"
                  onClick={() => handleRespond(r.bookingId, "declined")}
                  disabled={acting === r.bookingId}
                >
                  Decline
                </button>
                <button
                  className="btn-contact"
                  style={{ fontSize: "12px", padding: "6px 12px", marginTop: 4, width: "100%" }}
                  onClick={() => navigate("/messages")}
                >
                  Messages
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProviderRequestsWidget;
