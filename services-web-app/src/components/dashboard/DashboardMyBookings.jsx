import { useCallback, useEffect, useState } from "react";
import ContactModal from "../messaging/ContactModal";
import BookModal from "../booking/BookModal";
import BookingStatusBadge from "../booking/BookingStatusBadge";
import { cancelBooking, fetchClientBookings } from "../../api/bookings.js";
import "../../styles/dashboard/dashboardBookings.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${suffix}`;
};

const DashboardMyBookings = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(null);
  const [bookModal, setBookModal] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [toast, setToast] = useState(null);

  const loadBookings = useCallback(() => {
    fetchClientBookings()
      .then((all) => {
        setUpcoming(all.filter((b) => b.status === "pending" || b.status === "accepted"));
        setHistory(all.filter((b) => b.status === "completed"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCancelConfirm = async () => {
    const bookingId = confirmCancel;
    setConfirmCancel(null);
    setCancelling(bookingId);

    try {
      await cancelBooking(bookingId);
      showToast("Booking cancelled.");
      loadBookings();
    } catch (error) {
      showToast(error.message || "Could not cancel booking.", "error");
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="bookings-area" id="my-bookings">
        <div className="bookings-header"><h2>My Bookings</h2></div>
        <p style={{ color: "rgba(17,17,17,0.5)", fontSize: 14 }}>Loading bookings…</p>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className={`bookings-toast bookings-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}

      <div className="bookings-area" id="my-bookings">
        <div className="bookings-containers">

          {/* UPCOMING WIDGET */}
          <div className="bookings-panel">
            <div className="bookings-section-heading">
              <h2>My Bookings</h2>
            </div>

            <div className="bookings-widget upcoming-widget">
              <div className="widget-header">
                <h3 className="widget-heading">Active Bookings</h3>
                <span className="widget-badge">{upcoming.length}</span>
              </div>

              <div
                className="bookings-scroll-region"
                aria-label="Active bookings"
                tabIndex={upcoming.length > 0 ? 0 : undefined}
              >
                {upcoming.length === 0 ? (
                  <p className="bookings-empty">No active bookings.</p>
                ) : (
                  upcoming.map((b) => (
                    <div key={b.bookingId} className="booking-row">
                      <div className="booking-info">
                        <p className="widget-date">
                          {formatDate(b.requestedDate)}{b.requestedTime ? ` at ${formatTime(b.requestedTime)}` : ""}
                        </p>
                        <p className="widget-service">{b.serviceTitle}</p>
                        <p className="widget-provider">{b.providerName}</p>
                      </div>

                      <div className="booking-actions">
                        <BookingStatusBadge status={b.status} />
                        <div className="booking-action-buttons">
                          <button
                            className="btn-contact compact-action-button"
                            onClick={() => setContactModal({ serviceId: b.serviceId })}
                          >
                            Contact
                          </button>
                          <button
                            className="booking-cancel-button"
                            onClick={() => setConfirmCancel(b.bookingId)}
                            disabled={cancelling === b.bookingId}
                          >
                            {cancelling === b.bookingId ? "Cancelling..." : "Cancel"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* HISTORY WIDGET */}
          <div className="bookings-panel">
            <div className="bookings-section-heading">
              <h2>Recent Services</h2>
              <span className="widget-badge">{history.length}</span>
            </div>

            <div className="bookings-widget history-widget">
              <div
                className="bookings-scroll-region"
                aria-label="Recent services"
                tabIndex={history.length > 0 ? 0 : undefined}
              >
                {history.length === 0 ? (
                  <p className="bookings-empty">No completed services yet.</p>
                ) : (
                  history.map((b) => (
                    <div key={b.bookingId} className="history-card">
                      <div className="booking-info">
                        <p className="widget-date">{formatDate(b.requestedDate)}</p>
                        <p className="widget-service">{b.serviceTitle}</p>
                        <p className="widget-provider">{b.providerName}</p>
                      </div>

                      <div className="history-actions">
                        <button
                          className="re-book-button"
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

                        <button className="review-button" disabled>
                          Leave Review
                        </button>

                        <button
                          className="btn-contact compact-action-button"
                          onClick={() => setContactModal({ serviceId: b.serviceId })}
                        >
                          Contact
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <ContactModal
        isOpen={contactModal !== null}
        onClose={() => setContactModal(null)}
        serviceId={contactModal?.serviceId}
      />

      <BookModal
        isOpen={bookModal !== null}
        onClose={() => setBookModal(null)}
        service={bookModal}
        onSuccess={() => setBookModal(null)}
      />

      {confirmCancel && (
        <div className="booking-confirm-overlay" onClick={() => setConfirmCancel(null)}>
          <div
            className="booking-confirm-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-cancel-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="booking-confirm-title" id="booking-cancel-title">Cancel Booking?</h3>
            <p className="booking-confirm-message">
              Are you sure you want to cancel this booking? This cannot be undone.
            </p>
            <div className="booking-confirm-actions">
              <button className="booking-confirm-keep" onClick={() => setConfirmCancel(null)}>
                Keep It
              </button>
              <button className="booking-confirm-cancel" onClick={handleCancelConfirm}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardMyBookings;
