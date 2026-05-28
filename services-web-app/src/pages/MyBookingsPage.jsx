import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import BookingStatusBadge from "../components/booking/BookingStatusBadge";
import BookModal from "../components/booking/BookModal";
import ContactModal from "../components/messaging/ContactModal";
import { fetchClientBookings, cancelBooking } from "../api/bookings.js";
import "../styles/pages/myBookingsPage.css";

const TABS = [
  { key: null, label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${suffix}`;
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [bookModal, setBookModal] = useState(null); // service object for re-booking
  const [contactModal, setContactModal] = useState(null); // { recipientId, bookingId }
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetchClientBookings(activeTab)
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCancelConfirm = async () => {
    const bookingId = confirmCancel;
    setConfirmCancel(null);
    setCancelling(bookingId);
    try {
      await cancelBooking(bookingId);
      showToast("Booking cancelled.");
      load();
    } catch (err) {
      showToast(err.message || "Could not cancel booking.", "error");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="mbp-page">
      <DashboardNavbar />

      {toast && (
        <div className={`mbp-toast mbp-toast-${toast.type}`} role="status">{toast.msg}</div>
      )}

      <div className="mbp-container">
        <div className="mbp-heading-row">
          <h1 className="mbp-heading">My Bookings</h1>
        </div>

        <div className="mbp-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key ?? "all"}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`mbp-tab ${activeTab === tab.key ? "mbp-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mbp-state-msg">Loading bookings…</p>
        ) : error ? (
          <p className="mbp-state-msg mbp-error-msg">{error}</p>
        ) : bookings.length === 0 ? (
          <div className="mbp-empty">
            <p className="mbp-empty-title">No bookings found</p>
            <p className="mbp-empty-sub">
              {activeTab ? `You have no ${activeTab} bookings.` : "You haven't made any bookings yet."}
            </p>
            <button className="mbp-btn-browse" onClick={() => navigate("/services")}>
              Browse Services
            </button>
          </div>
        ) : (
          <div className="mbp-list">
            {bookings.map((b) => (
              <div key={b.bookingId} className="mbp-card">
                <div className="mbp-card-header">
                  <div>
                    <p className="mbp-service-title">{b.serviceTitle}</p>
                    <p className="mbp-provider-name">by {b.providerName}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>

                <div className="mbp-card-meta">
                  {b.requestedDate && (
                    <span className="mbp-meta-item">
                      📅 {formatDate(b.requestedDate)}{b.requestedTime ? ` at ${formatTime(b.requestedTime)}` : ""}
                    </span>
                  )}
                  {b.categoryName && (
                    <span className="mbp-meta-item mbp-category">{b.categoryName}</span>
                  )}
                </div>

                {b.clientMessage && (
                  <p className="mbp-message">"{b.clientMessage}"</p>
                )}

                {b.providerResponseMessage && (
                  <p className="mbp-response">Provider: "{b.providerResponseMessage}"</p>
                )}

                <div className="mbp-card-actions">
                  {(b.status === "pending" || b.status === "accepted") && (
                    <button
                      className="mbp-btn-cancel"
                      onClick={() => setConfirmCancel(b.bookingId)}
                      disabled={cancelling === b.bookingId}
                    >
                      {cancelling === b.bookingId ? "Cancelling…" : "Cancel"}
                    </button>
                  )}

                  <button
                    className="mbp-btn-contact"
                    onClick={() => setContactModal({ serviceId: b.serviceId })}
                  >
                    Contact Provider
                  </button>

                  {b.status === "completed" && (
                    <button
                      className="mbp-btn-rebook"
                      onClick={() =>
                        setBookModal({
                          providerServiceId: b.serviceId,
                          providerId: b.providerId,
                          serviceName: b.serviceTitle,
                          providerName: b.providerName,
                          pricingType: b.pricingType,
                          rateAmount: b.priceAmount,
                        })
                      }
                    >
                      Book Again
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmCancel && (
        <div className="mbp-confirm-overlay" onClick={() => setConfirmCancel(null)}>
          <div className="mbp-confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="mbp-confirm-title">Cancel Booking?</h3>
            <p className="mbp-confirm-msg">Are you sure you want to cancel this booking? This cannot be undone.</p>
            <div className="mbp-confirm-actions">
              <button className="mbp-confirm-btn-no" onClick={() => setConfirmCancel(null)}>Keep It</button>
              <button className="mbp-confirm-btn-yes" onClick={handleCancelConfirm}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      <BookModal
        isOpen={bookModal !== null}
        onClose={() => setBookModal(null)}
        service={bookModal}
        onSuccess={() => { setBookModal(null); showToast("Booking request sent!"); load(); }}
      />

      <ContactModal
        isOpen={contactModal !== null}
        onClose={() => setContactModal(null)}
        serviceId={contactModal?.serviceId}
      />
    </div>
  );
};

export default MyBookingsPage;
