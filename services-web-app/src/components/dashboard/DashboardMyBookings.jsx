import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ContactModal from "../messaging/ContactModal";
import BookModal from "../booking/BookModal";
import BookingStatusBadge from "../booking/BookingStatusBadge";
import { fetchClientBookings } from "../../api/bookings.js";
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
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(null);
  const [bookModal, setBookModal] = useState(null);

  useEffect(() => {
    fetchClientBookings()
      .then((all) => {
        setUpcoming(all.filter((b) => b.status === "pending" || b.status === "accepted"));
        setHistory(all.filter((b) => b.status === "completed"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bookings-area">
        <div className="bookings-header"><h2>My Bookings</h2></div>
        <p style={{ color: "rgba(17,17,17,0.5)", fontSize: 14 }}>Loading bookings…</p>
      </div>
    );
  }

  return (
    <>
      <div className="bookings-area">
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

              {upcoming.length === 0 ? (
                <p style={{ fontSize: 14, color: "rgba(17,17,17,0.5)", margin: "8px 0" }}>No active bookings.</p>
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                      <BookingStatusBadge status={b.status} />
                      <button
                        className="btn-contact"
                        style={{ fontSize: "12px", padding: "4px 10px" }}
                        onClick={() => setContactModal({ serviceId: b.serviceId })}
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button className="view-all-button" onClick={() => navigate("/my-bookings")}>
                View all bookings
              </button>
            </div>
          </div>

          {/* HISTORY WIDGET */}
          <div className="bookings-panel">
            <div className="bookings-section-heading">
              <h2>Recent Services</h2>
              <span className="widget-badge">{history.length}</span>
            </div>

            <div className="bookings-widget history-widget">
              {history.length === 0 ? (
                <p style={{ fontSize: 14, color: "rgba(17,17,17,0.5)", margin: "8px 0" }}>No completed services yet.</p>
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
                        className="btn-contact"
                        style={{ fontSize: "12px", padding: "4px 10px" }}
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
    </>
  );
};

export default DashboardMyBookings;
