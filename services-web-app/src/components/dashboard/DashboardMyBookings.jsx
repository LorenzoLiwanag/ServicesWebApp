import { useCallback, useEffect, useState } from "react";
import ContactModal from "../messaging/ContactModal";
import BookModal from "../booking/BookModal";
import BookingStatusBadge from "../booking/BookingStatusBadge";
import { CancelBookingDialog, DepositPanel, ReasonDialog } from "../booking/BookingPayment";
import { confirmWorkDone, fetchClientBookings, reportProblem } from "../../api/bookings.js";
import { formatManilaDateTime, formatPeso, parseCalendarDate } from "../../utils/payments.js";
import "../../styles/dashboard/dashboardBookings.css";

const ACTIVE_STATUSES = ["pending", "accepted", "confirmed", "work_done"];
const AUTO_CONFIRM_MS = 48 * 3600 * 1000;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = parseCalendarDate(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${suffix}`;
};

// What the client needs to know (or do) about money for this booking.
const PaymentStatus = ({ booking: b, onChanged }) => {
  if (b.onHold) {
    return (
      <div className="pay-panel pay-panel-warn">
        <strong>On hold.</strong> An admin is reviewing the reported problem. Nothing moves until it's resolved.
      </div>
    );
  }
  if (b.status === "accepted" && b.depositAmount !== null) {
    return <DepositPanel booking={b} onSubmitted={onChanged} />;
  }
  if (b.status === "confirmed") {
    return (
      <div className="pay-panel pay-panel-success">
        <strong>Deposit received.</strong> Pay {b.providerName} {formatPeso(b.balanceOnSite)} on site.
      </div>
    );
  }
  if (b.status === "work_done") {
    const autoAt = new Date(new Date(b.workDoneAt).getTime() + AUTO_CONFIRM_MS);
    return (
      <div className="pay-panel pay-panel-info">
        <strong>{b.providerName} marked this job done.</strong> Confirm it or report a problem by{" "}
        {formatManilaDateTime(autoAt)} (Manila time). After that it's confirmed automatically.
      </div>
    );
  }
  return null;
};

const RefundLine = ({ booking: b }) =>
  b.refundDue > 0 ? (
    <p className="widget-provider">
      Refund {formatPeso(b.refundDue)} — {b.refundSentAt ? "sent to your GCash" : "being processed"}
    </p>
  ) : null;

const DashboardMyBookings = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(null);
  const [bookModal, setBookModal] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [toast, setToast] = useState(null);

  const loadBookings = useCallback(() => {
    fetchClientBookings()
      .then((all) => {
        setUpcoming(all.filter((b) => ACTIVE_STATUSES.includes(b.status)));
        setHistory(all.filter((b) => b.status === "completed" || (b.status === "cancelled" && b.refundDue > 0)));
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

  const handleCancelled = () => {
    setConfirmCancel(null);
    showToast("Booking cancelled.");
    loadBookings();
  };

  const handleReport = async (reason) => {
    await reportProblem(reporting, reason);
    setReporting(null);
    showToast("Problem reported. An admin will review it.");
    loadBookings();
  };

  const handleConfirmDone = async (bookingId) => {
    setConfirming(bookingId);
    try {
      await confirmWorkDone(bookingId);
      showToast("Thanks — job confirmed.");
      loadBookings();
    } catch (error) {
      showToast(error.message || "Could not confirm the job.", "error");
    } finally {
      setConfirming(null);
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
                    <div key={b.bookingId} className="booking-row has-payment">
                      <div className="booking-info">
                        <p className="widget-date">
                          {formatDate(b.requestedDate)}{b.requestedTime ? ` at ${formatTime(b.requestedTime)}` : ""}
                        </p>
                        <p className="widget-service">{b.serviceTitle}</p>
                        <p className="widget-provider">{b.providerName}</p>
                      </div>

                      <div className="booking-actions">
                        <BookingStatusBadge status={b.status} onHold={b.onHold} />
                        <div className="booking-action-buttons">
                          {b.status === "work_done" && !b.onHold && (
                            <button
                              className="pay-btn pay-btn-primary pay-btn-small"
                              onClick={() => handleConfirmDone(b.bookingId)}
                              disabled={confirming === b.bookingId}
                            >
                              {confirming === b.bookingId ? "Confirming…" : "Confirm job done"}
                            </button>
                          )}
                          <button
                            className="btn-contact compact-action-button"
                            onClick={() => setContactModal({ serviceId: b.serviceId })}
                          >
                            Contact
                          </button>
                          {["confirmed", "work_done"].includes(b.status) && !b.onHold && (
                            <button className="booking-cancel-button" onClick={() => setReporting(b.bookingId)}>
                              Report a problem
                            </button>
                          )}
                          {b.status !== "work_done" && !b.onHold && (
                            <button className="booking-cancel-button" onClick={() => setConfirmCancel(b.bookingId)}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <PaymentStatus booking={b} onChanged={loadBookings} />
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
                        {b.status === "cancelled" && <p className="widget-provider">Cancelled</p>}
                        <RefundLine booking={b} />
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

                        {b.status === "completed" && (
                          <button className="review-button" disabled>
                            Leave Review
                          </button>
                        )}

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
        <CancelBookingDialog
          bookingId={confirmCancel}
          onClose={() => setConfirmCancel(null)}
          onCancelled={handleCancelled}
        />
      )}

      {reporting && (
        <ReasonDialog
          title="Report a problem"
          description="The booking goes on hold and an admin reviews it. Nothing is paid out or refunded until it's resolved."
          placeholder="e.g. The provider didn't show up."
          confirmLabel="Report problem"
          onSubmit={handleReport}
          onClose={() => setReporting(null)}
        />
      )}
    </>
  );
};

export default DashboardMyBookings;
