import "../../styles/booking/bookingStatusBadge.css";

const LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  confirmed: "Confirmed",
  work_done: "Marked done",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
  expired: "Expired",
};

const BookingStatusBadge = ({ status, onHold = false }) =>
  onHold ? (
    <span className="booking-status-badge booking-status-on-hold">On hold</span>
  ) : (
    <span className={`booking-status-badge booking-status-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );

export default BookingStatusBadge;
