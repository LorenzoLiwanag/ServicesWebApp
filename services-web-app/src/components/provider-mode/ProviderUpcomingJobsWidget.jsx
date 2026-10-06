import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProviderBookings, markWorkDone, reportProblem, respondToBooking } from "../../api/bookings.js";
import BookingStatusBadge from "../booking/BookingStatusBadge";
import { CancelBookingDialog, ReasonDialog } from "../booking/BookingPayment";
import { formatManilaDateTime, formatPeso, parseCalendarDate } from "../../utils/payments.js";
import "../../styles/provider-mode/providerUpcomingJobsWidget.css";

const ACTIVE_STATUSES = ["accepted", "confirmed", "work_done"];
const AUTO_CONFIRM_MS = 48 * 3600 * 1000;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = parseCalendarDate(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  return ` at ${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

// Accepted before the payment system shipped: no deposit, old completion flow.
const isLegacy = (job) => job.depositAmount === null;

const statusNote = (job) => {
  if (job.onHold) return { tone: "warn", text: "On hold — an admin is reviewing a reported problem." };
  if (isLegacy(job)) return null;
  if (job.status === "accepted") {
    return job.depositStatus === "submitted"
      ? { tone: "info", text: "The client's deposit is being verified." }
      : { tone: "info", text: `Waiting for the client's ${formatPeso(job.depositAmount)} deposit (due ${formatManilaDateTime(job.depositDueAt)}).` };
  }
  if (job.status === "confirmed") {
    return { tone: "success", text: `Deposit received — the job is on. Collect ${formatPeso(job.balanceOnSite)} from the client on site.` };
  }
  if (job.status === "work_done") {
    const autoAt = new Date(new Date(job.workDoneAt).getTime() + AUTO_CONFIRM_MS);
    return { tone: "info", text: `Waiting for the client to confirm. It confirms automatically on ${formatManilaDateTime(autoAt)}.` };
  }
  return null;
};

const ProviderUpcomingJobsWidget = ({ refreshKey }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchProviderBookings()
      .then((all) => {
        setJobs(all.filter((b) => ACTIVE_STATUSES.includes(b.status)));
        setPayouts(all.filter((b) => ["completed", "cancelled"].includes(b.status) && b.payoutDue > 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const runAction = async (bookingId, action, successMessage) => {
    setActing(bookingId);
    try {
      await action();
      showToast(successMessage);
      load();
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setActing(null);
    }
  };

  const handleReport = async (reason) => {
    await reportProblem(reporting, reason);
    setReporting(null);
    showToast("Problem reported. An admin will review it.");
    load();
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
          jobs.map((job) => {
            const note = statusNote(job);
            const busy = acting === job.bookingId;
            return (
              <div key={job.bookingId} className="job-item has-payment">
                <div className="job-info">
                  <h3 className="job-service">{job.serviceTitle}</h3>
                  <p className="job-client">Client: {job.clientFirstName} {job.clientLastName}</p>
                  <p className="job-time">
                    {formatDate(job.requestedDate)}{formatTime(job.requestedTime)}
                  </p>
                  {!isLegacy(job) && (
                    <p className="job-time">
                      Total {formatPeso(job.agreedTotal)} · you get {formatPeso(job.depositAmount - job.platformFee)} payout
                      {" "}+ {formatPeso(job.balanceOnSite)} on site
                    </p>
                  )}
                  {job.clientMessage && (
                    <p style={{ fontSize: 13, color: "rgba(17,17,17,0.6)", marginTop: 4, fontStyle: "italic" }}>
                      "{job.clientMessage}"
                    </p>
                  )}
                </div>

                <div className="job-actions">
                  <BookingStatusBadge status={job.status} onHold={job.onHold} />
                  <button className="btn-contact job-action-btn" onClick={() => navigate("/messages")}>
                    Messages
                  </button>
                  {isLegacy(job) && job.status === "accepted" && (
                    <button
                      className="job-complete-btn"
                      onClick={() => runAction(job.bookingId, () => respondToBooking(job.bookingId, { status: "completed" }), "Job marked as completed.")}
                      disabled={busy}
                    >
                      {busy ? "Saving…" : "Mark Complete"}
                    </button>
                  )}
                  {job.status === "confirmed" && !job.onHold && (
                    <button
                      className="job-complete-btn"
                      onClick={() => runAction(job.bookingId, () => markWorkDone(job.bookingId), "Marked as done. The client has been asked to confirm.")}
                      disabled={busy}
                    >
                      {busy ? "Saving…" : "Mark as done"}
                    </button>
                  )}
                  {["confirmed", "work_done"].includes(job.status) && !job.onHold && (
                    <button className="pay-btn pay-btn-secondary pay-btn-small" onClick={() => setReporting(job.bookingId)}>
                      Report a problem
                    </button>
                  )}
                  {["accepted", "confirmed"].includes(job.status) && !job.onHold && (
                    <button className="pay-btn pay-btn-secondary pay-btn-small" onClick={() => setCancelling(job.bookingId)}>
                      Cancel
                    </button>
                  )}
                </div>

                {note && <div className={`pay-panel pay-panel-${note.tone}`}>{note.text}</div>}
              </div>
            );
          })
        )}
      </div>

      {payouts.length > 0 && (
        <>
          <div className="widget-header" style={{ marginTop: 24 }}>
            <h2 className="widget-title">Payouts</h2>
          </div>
          <div className="jobs-list">
            {payouts.map((job) => (
              <div key={job.bookingId} className="job-item">
                <div className="job-info">
                  <h3 className="job-service">{job.serviceTitle}</h3>
                  <p className="job-time">
                    {formatDate(job.requestedDate)}
                    {job.status === "cancelled" ? " · cancelled late by the client" : ""}
                  </p>
                </div>
                <div className="job-actions">
                  {job.payoutSentAt ? (
                    <>
                      <strong>{formatPeso(job.payoutAmount)} sent</strong>
                      {job.payoutReference && <span className="job-time">Ref {job.payoutReference}</span>}
                    </>
                  ) : (
                    <>
                      <strong>{formatPeso(job.payoutDue)}</strong>
                      <span className="job-time">{job.onHold ? "On hold" : "Pending"}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {cancelling && (
        <CancelBookingDialog
          bookingId={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={() => {
            setCancelling(null);
            showToast("Booking cancelled.");
            load();
          }}
        />
      )}

      {reporting && (
        <ReasonDialog
          title="Report a problem"
          description="The booking goes on hold and an admin reviews it. Nothing is paid out or refunded until it's resolved."
          placeholder="e.g. The client wasn't home at the scheduled time."
          confirmLabel="Report problem"
          onSubmit={handleReport}
          onClose={() => setReporting(null)}
        />
      )}
    </div>
  );
};

export default ProviderUpcomingJobsWidget;
