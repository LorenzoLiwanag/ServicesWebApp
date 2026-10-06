// Payment pieces shared by the client and provider dashboards
// (PRD_PAYMENT_SYSTEM_V2.md §5, §6, §11).
import { useEffect, useState } from "react";
import {
  cancelBooking,
  fetchCancelPreview,
  respondToBooking,
  submitDeposit,
} from "../../api/bookings.js";
import {
  formatManilaDateTime,
  formatPeso,
  PLATFORM_GCASH,
  previewAmounts,
  previewHourlyTotal,
} from "../../utils/payments.js";
import "../../styles/booking/payment.css";

export const PaymentDialog = ({ title, onClose, busy, children }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (
    <div className="pay-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="pay-dialog" role="dialog" aria-modal="true" aria-labelledby="pay-dialog-title">
        <h3 className="pay-dialog-title" id="pay-dialog-title">{title}</h3>
        {children}
      </div>
    </div>
  );
};

// ── Cancel with a preview of the money outcome ──────────────────────────────

const describeCancellation = (p) => {
  const deposit = formatPeso(p.depositAmount);
  if (!p.paid) {
    return p.by === "client"
      ? "You haven't paid a deposit, so nothing is charged."
      : "The client hasn't paid a deposit yet, so no money is involved.";
  }
  if (p.by === "client") {
    return p.late
      ? `It's less than 24 hours before the service, so your ${deposit} deposit won't be refunded.`
      : `You'll get ${formatPeso(p.refundDue)} back. ${formatPeso(p.platformEarned)} of your ${deposit} deposit is kept as a cancellation fee.`;
  }
  return p.late
    ? `The client gets their full ${deposit} deposit back. Because it's less than 24 hours before the service, a ${formatPeso(p.penalty)} penalty will be taken from your next payout, and you can't accept new bookings until it's settled.`
    : `The client gets their full ${deposit} deposit back. There's no penalty.`;
};

export const CancelBookingDialog = ({ bookingId, onClose, onCancelled }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchCancelPreview(bookingId).then(setPreview).catch((e) => setError(e.message));
  }, [bookingId]);

  const handleConfirm = async () => {
    setBusy(true);
    setError("");
    try {
      await cancelBooking(bookingId);
      onCancelled();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <PaymentDialog title="Cancel booking?" onClose={onClose} busy={busy}>
      {!preview && !error && <p className="pay-dialog-text">Checking cancellation terms…</p>}
      {preview && <p className="pay-dialog-text">{describeCancellation(preview)} This can't be undone.</p>}
      {error && <p className="pay-error" role="alert">{error}</p>}
      <div className="pay-dialog-actions">
        <button className="pay-btn pay-btn-secondary" onClick={onClose} disabled={busy}>Keep It</button>
        {preview && (
          <button className="pay-btn pay-btn-danger" onClick={handleConfirm} disabled={busy}>
            {busy ? "Cancelling…" : "Yes, Cancel"}
          </button>
        )}
      </div>
    </PaymentDialog>
  );
};

// ── Free-text reason (report a problem) ─────────────────────────────────────

export const ReasonDialog = ({ title, description, placeholder, confirmLabel, onSubmit, onClose }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please describe the problem.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(reason.trim());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <PaymentDialog title={title} onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit}>
        <p className="pay-dialog-text">{description}</p>
        <label className="pay-label" htmlFor="pay-reason">What happened?</label>
        <textarea
          id="pay-reason"
          className="pay-input pay-textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
          rows={4}
          disabled={busy}
        />
        {error && <p className="pay-error" role="alert">{error}</p>}
        <div className="pay-dialog-actions">
          <button type="button" className="pay-btn pay-btn-secondary" onClick={onClose} disabled={busy}>Back</button>
          <button type="submit" className="pay-btn pay-btn-danger" disabled={busy}>
            {busy ? "Sending…" : confirmLabel}
          </button>
        </div>
      </form>
    </PaymentDialog>
  );
};

// ── Provider: accept with a locked total ────────────────────────────────────

export const AcceptBookingDialog = ({ booking, onClose, onAccepted }) => {
  const [hours, setHours] = useState("");
  const [quote, setQuote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { pricingType, priceAmount, feeRate } = booking;
  const total =
    pricingType === "fixed" ? priceAmount
    : pricingType === "hourly" ? (Number(hours) > 0 ? previewHourlyTotal(hours, priceAmount) : null)
    : Number(quote) || null;
  const amounts = total ? previewAmounts(total, feeRate) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await respondToBooking(booking.bookingId, {
        status: "accepted",
        estimatedHours: pricingType === "hourly" ? Number(hours) : undefined,
        agreedTotal: pricingType === "quote" ? Number(quote) : undefined,
      });
      onAccepted();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <PaymentDialog title="Accept booking" onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit}>
        <p className="pay-dialog-text">
          <strong>{booking.serviceTitle}</strong> for {booking.clientFirstName} {booking.clientLastName}.
          The total is locked once you accept.
        </p>

        {pricingType === "fixed" && (
          <p className="pay-dialog-text">Fixed price: <strong>{formatPeso(priceAmount)}</strong></p>
        )}
        {pricingType === "hourly" && (
          <>
            <label className="pay-label" htmlFor="pay-hours">
              Estimated hours at {formatPeso(priceAmount)}/hr
            </label>
            <input
              id="pay-hours"
              className="pay-input"
              type="number"
              min="0.25"
              max="999.99"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
              disabled={busy}
            />
          </>
        )}
        {pricingType === "quote" && (
          <>
            <label className="pay-label" htmlFor="pay-quote">Total price for this job (₱)</label>
            <input
              id="pay-quote"
              className="pay-input"
              type="number"
              min="1"
              step="0.01"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              required
              disabled={busy}
            />
          </>
        )}

        {amounts && (
          <dl className="pay-breakdown">
            <div><dt>Total</dt><dd>{formatPeso(amounts.total)}</dd></div>
            <div><dt>Client's deposit (to the platform)</dt><dd>{formatPeso(amounts.deposit)}</dd></div>
            <div><dt>Platform fee</dt><dd>−{formatPeso(amounts.fee)}</dd></div>
            <div><dt>Paid out to you after the job</dt><dd>{formatPeso(amounts.payout)}</dd></div>
            <div><dt>Client pays you on site</dt><dd>{formatPeso(amounts.balance)}</dd></div>
            <div className="pay-breakdown-total"><dt>You receive</dt><dd>{formatPeso(amounts.payout + amounts.balance)}</dd></div>
          </dl>
        )}

        {error && <p className="pay-error" role="alert">{error}</p>}
        <div className="pay-dialog-actions">
          <button type="button" className="pay-btn pay-btn-secondary" onClick={onClose} disabled={busy}>Back</button>
          <button type="submit" className="pay-btn pay-btn-primary" disabled={busy || !amounts}>
            {busy ? "Accepting…" : "Accept booking"}
          </button>
        </div>
      </form>
    </PaymentDialog>
  );
};

// ── Client: pay the deposit ─────────────────────────────────────────────────

export const DepositPanel = ({ booking, onSubmitted }) => {
  const [screenshot, setScreenshot] = useState(null);
  const [reference, setReference] = useState("");
  const [paidFrom, setPaidFrom] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrMissing, setQrMissing] = useState(false);

  if (booking.depositStatus === "submitted") {
    return (
      <div className="pay-panel pay-panel-info">
        <strong>Payment under review.</strong> We'll confirm your {formatPeso(booking.depositAmount)} deposit shortly.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!screenshot) {
      setError("Attach a screenshot of your GCash payment.");
      return;
    }
    if (screenshot.size > 5 * 1024 * 1024) {
      setError("The screenshot must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await submitDeposit(booking.bookingId, { screenshot, gcashReference: reference, gcashNumber: paidFrom });
      onSubmitted();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const id = (name) => `pay-${name}-${booking.bookingId}`;

  return (
    <div className="pay-panel">
      {booking.depositStatus === "rejected" && (
        <p className="pay-error" role="alert">
          We couldn't verify your last payment: {booking.depositNote} Please upload it again.
        </p>
      )}
      <p className="pay-panel-lead">
        Pay the <strong>{formatPeso(booking.depositAmount)}</strong> deposit by{" "}
        <strong>{formatManilaDateTime(booking.depositDueAt)}</strong> (Manila time) or the booking expires.
        You'll pay the other {formatPeso(booking.balanceOnSite)} to the provider on site.
      </p>
      <div className="pay-qr-row">
        {!qrMissing && (
          <img className="pay-qr" src={PLATFORM_GCASH.qrSrc} alt="Platform GCash QR code" onError={() => setQrMissing(true)} />
        )}
        <div className="pay-gcash">
          <span className="pay-gcash-label">Send via GCash to</span>
          <span className="pay-gcash-name">{PLATFORM_GCASH.name || "Works For You"}</span>
          {PLATFORM_GCASH.number && <span className="pay-gcash-number">{PLATFORM_GCASH.number}</span>}
        </div>
      </div>
      <form className="pay-form" onSubmit={handleSubmit} noValidate>
        <label className="pay-label" htmlFor={id("shot")}>Payment screenshot</label>
        <input
          id={id("shot")}
          className="pay-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setScreenshot(e.target.files[0] || null)}
          disabled={busy}
        />
        <div className="pay-form-row">
          <div>
            <label className="pay-label" htmlFor={id("ref")}>GCash reference no.</label>
            <input
              id={id("ref")}
              className="pay-input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              inputMode="numeric"
              maxLength={64}
              disabled={busy}
            />
          </div>
          <div>
            <label className="pay-label" htmlFor={id("from")}>GCash number you paid from</label>
            <input
              id={id("from")}
              className="pay-input"
              value={paidFrom}
              onChange={(e) => setPaidFrom(e.target.value)}
              placeholder="09XX XXX XXXX"
              inputMode="tel"
              maxLength={16}
              disabled={busy}
            />
          </div>
        </div>
        <p className="pay-hint">Any refund goes back to this number.</p>
        {error && <p className="pay-error" role="alert">{error}</p>}
        <button type="submit" className="pay-btn pay-btn-primary" disabled={busy}>
          {busy ? "Uploading…" : "Submit payment"}
        </button>
      </form>
    </div>
  );
};
