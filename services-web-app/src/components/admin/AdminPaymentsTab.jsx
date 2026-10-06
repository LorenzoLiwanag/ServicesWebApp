// Admin → Payments: the four manual queues of PRD_PAYMENT_SYSTEM_V2.md §11.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchDepositsToVerify,
  fetchHolds,
  fetchPayoutsDue,
  fetchProofObjectUrl,
  fetchRefundsDue,
  rejectDeposit,
  resolveHold,
  sendPayout,
  sendRefund,
  verifyDeposit,
} from "../../api/admin.js";
import { PaymentDialog } from "../booking/BookingPayment";
import { formatManilaDateTime, formatPeso } from "../../utils/payments.js";

const BookingCell = ({ row }) => (
  <>
    <span className="ap-cell-strong">#{row.bookingId} · {row.serviceTitle}</span>
    <span className="ap-cell-sub">{row.clientName} → {row.providerName}</span>
    <span className="ap-cell-sub">Service {formatManilaDateTime(row.scheduledStart)}</span>
  </>
);

const Section = ({ title, note, loading, rows, empty, children }) => (
  <section style={{ marginBottom: 32 }}>
    <h2 className="ap-section-title">{title} {!loading && <span className="ap-tab-badge">{rows.length}</span>}</h2>
    {note && <p className="ap-section-note">{note}</p>}
    {loading && <div className="ap-skeleton"><div className="ap-skeleton-row" /></div>}
    {!loading && rows.length === 0 && <p className="ap-section-note">{empty}</p>}
    {!loading && rows.length > 0 && (
      <div className="ap-table-wrap">
        <table className="ap-table">{children}</table>
      </div>
    )}
  </section>
);

// One required text field: a rejection reason or a GCash reference number.
const TextPromptDialog = ({ title, description, label, multiline, confirmLabel, danger, onSubmit, onClose }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) {
      setError(`${label} is required.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(value.trim());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const Field = multiline ? "textarea" : "input";
  return (
    <PaymentDialog title={title} onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit}>
        <p className="pay-dialog-text">{description}</p>
        <label className="pay-label" htmlFor="ap-prompt">{label}</label>
        <Field id="ap-prompt" className="pay-input" value={value} onChange={(e) => setValue(e.target.value)}
          rows={multiline ? 3 : undefined} maxLength={multiline ? 500 : 64} disabled={busy} autoFocus />
        {error && <p className="pay-error" role="alert">{error}</p>}
        <div className="pay-dialog-actions">
          <button type="button" className="pay-btn pay-btn-secondary" onClick={onClose} disabled={busy}>Back</button>
          <button type="submit" className={`pay-btn ${danger ? "pay-btn-danger" : "pay-btn-primary"}`} disabled={busy}>
            {busy ? "Saving…" : confirmLabel}
          </button>
        </div>
      </form>
    </PaymentDialog>
  );
};

const ProofDialog = ({ paymentId, onClose }) => {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl;
    fetchProofObjectUrl(paymentId)
      .then((u) => { objectUrl = u; setUrl(u); })
      .catch((e) => setError(e.message));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [paymentId]);

  return (
    <PaymentDialog title="Payment screenshot" onClose={onClose}>
      {error && <p className="pay-error">{error}</p>}
      {!url && !error && <p className="pay-dialog-text">Loading…</p>}
      {url && <img src={url} alt="Client's GCash payment screenshot" style={{ width: "100%", borderRadius: 8 }} />}
      <div className="pay-dialog-actions">
        <button className="pay-btn pay-btn-secondary" onClick={onClose}>Close</button>
      </div>
    </PaymentDialog>
  );
};

const OUTCOME_LABELS = {
  complete: "Complete normally",
  provider_no_show: "Provider no-show (settle as provider late cancel)",
  customer_no_show: "Customer no-show (settle as client late cancel)",
};

const describeSettlement = (s) =>
  `Refund ${formatPeso(s.refundDue)} · provider ${formatPeso(s.payoutDue)} · platform ${formatPeso(s.platformEarned)}` +
  (s.penalty > 0 ? ` · +${formatPeso(s.penalty)} penalty` : "");

const ResolveDialog = ({ hold, onClose, onResolved }) => {
  const [outcome, setOutcome] = useState("complete");
  const [custom, setCustom] = useState({ refundDue: "", payoutDue: "", platformEarned: "" });
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Add a note explaining the resolution. Both parties will see it.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resolveHold(hold.bookingId, { outcome, note: note.trim(), ...(outcome === "custom" ? custom : {}) });
      onResolved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <PaymentDialog title={`Resolve booking #${hold.bookingId}`} onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit}>
        <p className="pay-dialog-text">
          Deposit held: <strong>{formatPeso(hold.depositAmount)}</strong> (fee {formatPeso(hold.platformFee)}).
        </p>
        {Object.entries(OUTCOME_LABELS).map(([key, label]) => (
          <label key={key} style={{ display: "block", margin: "8px 0", cursor: "pointer" }}>
            <input type="radio" name="outcome" value={key} checked={outcome === key} onChange={() => setOutcome(key)} disabled={busy} />{" "}
            <strong>{label}</strong>
            <span className="pay-hint" style={{ display: "block", marginLeft: 22 }}>{describeSettlement(hold.outcomes[key])}</span>
          </label>
        ))}
        <label style={{ display: "block", margin: "8px 0", cursor: "pointer" }}>
          <input type="radio" name="outcome" value="custom" checked={outcome === "custom"} onChange={() => setOutcome("custom")} disabled={busy} />{" "}
          <strong>Custom split</strong>
          <span className="pay-hint" style={{ display: "block", marginLeft: 22 }}>Must add up to the deposit.</span>
        </label>
        {outcome === "custom" && (
          <div className="pay-form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            {[["refundDue", "Refund"], ["payoutDue", "Provider"], ["platformEarned", "Platform"]].map(([key, label]) => (
              <div key={key}>
                <label className="pay-label" htmlFor={`ap-${key}`}>{label} (₱)</label>
                <input id={`ap-${key}`} className="pay-input" type="number" min="0" step="0.01" value={custom[key]}
                  onChange={(e) => setCustom((c) => ({ ...c, [key]: e.target.value }))} required disabled={busy} />
              </div>
            ))}
          </div>
        )}
        <label className="pay-label" htmlFor="ap-note">Note to both parties</label>
        <textarea id="ap-note" className="pay-input pay-textarea" rows={3} maxLength={1000} value={note}
          onChange={(e) => setNote(e.target.value)} disabled={busy} />
        {error && <p className="pay-error" role="alert">{error}</p>}
        <div className="pay-dialog-actions">
          <button type="button" className="pay-btn pay-btn-secondary" onClick={onClose} disabled={busy}>Back</button>
          <button type="submit" className="pay-btn pay-btn-primary" disabled={busy}>{busy ? "Saving…" : "Resolve"}</button>
        </div>
      </form>
    </PaymentDialog>
  );
};

const AdminPaymentsTab = () => {
  const [data, setData] = useState({ deposits: [], payouts: [], refunds: [], holds: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verifying, setVerifying] = useState(null);
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchDepositsToVerify(), fetchPayoutsDue(), fetchRefundsDue(), fetchHolds()])
      .then(([deposits, payouts, refunds, holds]) => setData({ deposits, payouts, refunds, holds }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const done = (message) => {
    setDialog(null);
    setError("");
    setSuccess(message);
    load();
  };

  const handleVerify = async (deposit) => {
    setVerifying(deposit.paymentId);
    setError("");
    setSuccess("");
    try {
      await verifyDeposit(deposit.paymentId);
      done(`Deposit for booking #${deposit.bookingId} verified. The job is confirmed.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div>
      {success && <p className="ap-banner ap-banner--success">{success}</p>}
      {error && <p className="ap-banner ap-banner--error">{error}</p>}

      <Section
        title="Deposits to verify"
        note="Check the platform's GCash app for a matching incoming transfer before verifying."
        loading={loading}
        rows={data.deposits}
        empty="No deposits waiting."
      >
        <thead>
          <tr><th>Booking</th><th>Expected</th><th>GCash ref</th><th>Paid from</th><th>Submitted</th><th>Proof</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {data.deposits.map((d) => (
            <tr key={d.paymentId}>
              <td data-label="Booking"><BookingCell row={d} /></td>
              <td data-label="Expected" className="ap-cell-strong">{formatPeso(d.amount)}</td>
              <td data-label="GCash ref">{d.gcashReference}</td>
              <td data-label="Paid from">{d.gcashNumber}</td>
              <td data-label="Submitted">
                {formatManilaDateTime(d.submittedAt)}
                <span className="ap-cell-sub">Due {formatManilaDateTime(d.depositDueAt)}</span>
              </td>
              <td data-label="Proof">
                <button className="ap-btn ap-btn--secondary" onClick={() => setDialog({ type: "proof", paymentId: d.paymentId })}>View</button>
              </td>
              <td data-label="Actions" className="ap-cell-actions">
                <div className="ap-actions-row">
                  <button className={`ap-btn ap-btn--approve ${verifying === d.paymentId ? "ap-btn--loading" : ""}`}
                    onClick={() => handleVerify(d)} disabled={verifying === d.paymentId}>
                    {verifying === d.paymentId ? "Verifying..." : "Verify"}
                  </button>
                  <button className="ap-btn ap-btn--reject" onClick={() => setDialog({ type: "reject", row: d })} disabled={verifying === d.paymentId}>
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Section>

      <Section
        title="Payouts to send"
        note="Send the amount shown to the provider's GCash, then record the reference. Any penalty they owe is already deducted."
        loading={loading}
        rows={data.payouts}
        empty="No payouts due."
      >
        <thead>
          <tr><th>Booking</th><th>Send to</th><th>Payout</th><th>Penalty</th><th>Send</th><th>Action</th></tr>
        </thead>
        <tbody>
          {data.payouts.map((p) => (
            <tr key={p.bookingId}>
              <td data-label="Booking">
                <BookingCell row={p} />
                {p.status === "cancelled" && <span className="ap-cell-sub">Cancelled late by the {p.cancelledBy}</span>}
              </td>
              <td data-label="Send to">
                <span className="ap-cell-strong">{p.gcashName}</span>
                <span className="ap-cell-sub">{p.gcashNumber}</span>
              </td>
              <td data-label="Payout">{formatPeso(p.payoutDue)}</td>
              <td data-label="Penalty">{p.penaltyDeducted > 0 ? `−${formatPeso(p.penaltyDeducted)}` : "—"}</td>
              <td data-label="Send" className="ap-cell-strong">{formatPeso(p.amountToSend)}</td>
              <td data-label="Action" className="ap-cell-actions">
                <button className="ap-btn ap-btn--primary" onClick={() => setDialog({ type: "payout", row: p })}>Mark sent</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Section>

      <Section
        title="Refunds to send"
        note="Refunds go back to the GCash number the client paid from."
        loading={loading}
        rows={data.refunds}
        empty="No refunds due."
      >
        <thead>
          <tr><th>Booking</th><th>Send to</th><th>Refund</th><th>Action</th></tr>
        </thead>
        <tbody>
          {data.refunds.map((r) => (
            <tr key={r.bookingId}>
              <td data-label="Booking">
                <BookingCell row={r} />
                {r.cancelledBy && <span className="ap-cell-sub">Cancelled by the {r.cancelledBy}</span>}
              </td>
              <td data-label="Send to">
                <span className="ap-cell-strong">{r.clientName}</span>
                <span className="ap-cell-sub">{r.gcashNumber}</span>
              </td>
              <td data-label="Refund" className="ap-cell-strong">{formatPeso(r.refundDue)}</td>
              <td data-label="Action" className="ap-cell-actions">
                <button className="ap-btn ap-btn--primary" onClick={() => setDialog({ type: "refund", row: r })}>Mark sent</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Section>

      <Section
        title="On hold"
        note={<>Reported problems. Read both sides in the <Link to="/admin/messages">message logs</Link> before resolving.</>}
        loading={loading}
        rows={data.holds}
        empty="Nothing on hold."
      >
        <thead>
          <tr><th>Booking</th><th>Reported by</th><th>Reason</th><th>Deposit</th><th>Action</th></tr>
        </thead>
        <tbody>
          {data.holds.map((h) => (
            <tr key={h.bookingId}>
              <td data-label="Booking"><BookingCell row={h} /></td>
              <td data-label="Reported by">
                {h.heldByParty === "client" ? h.clientName : h.providerName} ({h.heldByParty})
                <span className="ap-cell-sub">{formatManilaDateTime(h.heldAt)}</span>
              </td>
              <td data-label="Reason" style={{ maxWidth: 280 }}><span className="ap-cell-clamp">{h.holdReason}</span></td>
              <td data-label="Deposit">{formatPeso(h.depositAmount)}</td>
              <td data-label="Action" className="ap-cell-actions">
                <button className="ap-btn ap-btn--primary" onClick={() => setDialog({ type: "resolve", row: h })}>Resolve</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Section>

      {dialog?.type === "proof" && <ProofDialog paymentId={dialog.paymentId} onClose={() => setDialog(null)} />}

      {dialog?.type === "reject" && (
        <TextPromptDialog
          title="Reject deposit"
          description={`The client will be asked to upload booking #${dialog.row.bookingId}'s payment again. The booking stays open until its deadline.`}
          label="Reason shown to the client"
          multiline
          danger
          confirmLabel="Reject"
          onSubmit={async (reason) => {
            await rejectDeposit(dialog.row.paymentId, reason);
            done(`Deposit for booking #${dialog.row.bookingId} rejected. The client has been notified.`);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "payout" && (
        <TextPromptDialog
          title={`Payout for booking #${dialog.row.bookingId}`}
          description={`Send ${formatPeso(dialog.row.amountToSend)} to ${dialog.row.gcashName} (${dialog.row.gcashNumber}), then enter the GCash reference number.`}
          label="GCash reference number"
          confirmLabel="Mark sent"
          onSubmit={async (ref) => {
            await sendPayout(dialog.row.bookingId, ref);
            done(`Payout for booking #${dialog.row.bookingId} recorded.`);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "refund" && (
        <TextPromptDialog
          title={`Refund for booking #${dialog.row.bookingId}`}
          description={`Send ${formatPeso(dialog.row.refundDue)} to ${dialog.row.clientName} (${dialog.row.gcashNumber}), then enter the GCash reference number.`}
          label="GCash reference number"
          confirmLabel="Mark sent"
          onSubmit={async (ref) => {
            await sendRefund(dialog.row.bookingId, ref);
            done(`Refund for booking #${dialog.row.bookingId} recorded.`);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "resolve" && (
        <ResolveDialog
          hold={dialog.row}
          onClose={() => setDialog(null)}
          onResolved={() => done(`Booking #${dialog.row.bookingId} resolved. Both parties have been notified.`)}
        />
      )}
    </div>
  );
};

export default AdminPaymentsTab;
