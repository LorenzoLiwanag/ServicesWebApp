import { useState } from "react";
import { submitBooking } from "../../api/bookings.js";
import "../../styles/booking/bookModal.css";

const today = () => new Date().toISOString().split("T")[0];

const BookModal = ({ isOpen, onClose, service, onSuccess }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !service) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!date) { setError("Please select a preferred date."); return; }
    if (!time) { setError("Please select a preferred time."); return; }
    if (date < today()) { setError("Date cannot be in the past."); return; }

    setSubmitting(true);
    try {
      await submitBooking({
        providerServiceId: service.providerServiceId,
        providerId: service.providerId,
        requestedDate: date,
        requestedTime: time,
        clientMessage: notes.trim() || undefined,
      });
      setDate("");
      setTime("");
      setNotes("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setError("");
    onClose();
  };

  return (
    <div className="bm-overlay" onClick={handleClose}>
      <div className="bm-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="bm-title">
        <div className="bm-header">
          <h2 className="bm-title" id="bm-title">Book Service</h2>
          <button className="bm-close" onClick={handleClose} aria-label="Close" disabled={submitting}>×</button>
        </div>

        <div className="bm-service-info">
          <p className="bm-service-name">{service.serviceName}</p>
          <p className="bm-provider-name">By {service.providerName}</p>
          <p className="bm-price">
            {service.pricingType === "quote"
              ? "Price: Get Quote"
              : service.pricingType === "hourly"
              ? `₱${service.rateAmount}/hour`
              : `₱${service.rateAmount} fixed`}
          </p>
        </div>

        <form className="bm-form" onSubmit={handleSubmit} noValidate>
          <div className="bm-field">
            <label className="bm-label" htmlFor="bm-date">Preferred Date <span aria-hidden="true">*</span></label>
            <input
              id="bm-date"
              className="bm-input"
              type="date"
              min={today()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="bm-field">
            <label className="bm-label" htmlFor="bm-time">Preferred Time <span aria-hidden="true">*</span></label>
            <input
              id="bm-time"
              className="bm-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="bm-field">
            <label className="bm-label" htmlFor="bm-notes">Message to Provider <span className="bm-optional">(optional)</span></label>
            <textarea
              id="bm-notes"
              className="bm-textarea"
              placeholder="Any special instructions or details…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              disabled={submitting}
            />
          </div>

          {error && <p className="bm-error" role="alert">{error}</p>}

          <div className="bm-footer">
            <button type="button" className="bm-btn-cancel" onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="bm-btn-submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Send Booking Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookModal;
