// Where the platform sends this provider's payouts. Accepting bookings is
// blocked until it's filled in (PRD_PAYMENT_SYSTEM_V2.md §5.2).
import { useState } from "react";
import { updatePayoutDetails } from "../../api/provider.js";
import { getStoredAuthSession } from "../../utils/auth.js";
import { formatPeso } from "../../utils/payments.js";
import "../../styles/booking/payment.css";

const ProviderPayoutDetails = ({ profile, onSaved }) => {
  const missing = !profile?.gcashNumber;
  const [editing, setEditing] = useState(missing);
  const [name, setName] = useState(profile?.gcashName || "");
  const [number, setNumber] = useState(profile?.gcashNumber || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await updatePayoutDetails(getStoredAuthSession()?.token, { gcashName: name, gcashNumber: number });
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`pay-panel ${missing ? "pay-panel-warn" : ""}`} style={{ marginBottom: 16 }}>
      {profile?.penaltyBalance > 0 && (
        <p className="pay-error" role="alert" style={{ marginTop: 0, marginBottom: 10 }}>
          You owe a {formatPeso(profile.penaltyBalance)} late-cancellation penalty. It comes out of your next payout;
          until then you can't accept new bookings. Contact the admin to settle it sooner.
        </p>
      )}

      {editing ? (
        <form onSubmit={handleSubmit}>
          <strong>{missing ? "Add your GCash payout details to start accepting bookings." : "Edit GCash payout details"}</strong>
          <div className="pay-form-row">
            <div>
              <label className="pay-label" htmlFor="payout-name">Name on GCash account</label>
              <input id="payout-name" className="pay-input" value={name} onChange={(e) => setName(e.target.value)}
                maxLength={150} required disabled={busy} />
            </div>
            <div>
              <label className="pay-label" htmlFor="payout-number">GCash number</label>
              <input id="payout-number" className="pay-input" value={number} onChange={(e) => setNumber(e.target.value)}
                placeholder="09XX XXX XXXX" inputMode="tel" maxLength={16} required disabled={busy} />
            </div>
          </div>
          {error && <p className="pay-error" role="alert">{error}</p>}
          <div className="pay-actions-row">
            <button type="submit" className="pay-btn pay-btn-primary pay-btn-small" disabled={busy}>
              {busy ? "Saving…" : "Save payout details"}
            </button>
            {!missing && (
              <button type="button" className="pay-btn pay-btn-secondary pay-btn-small" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>
            Payouts go to <strong>{profile.gcashName}</strong> · {profile.gcashNumber}
          </span>
          <button className="pay-btn pay-btn-secondary pay-btn-small" onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};

export default ProviderPayoutDetails;
