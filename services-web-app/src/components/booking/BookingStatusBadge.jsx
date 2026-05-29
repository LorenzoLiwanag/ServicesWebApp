import "../../styles/booking/bookingStatusBadge.css";

const LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

const BookingStatusBadge = ({ status }) => (
  <span className={`booking-status-badge booking-status-${status}`}>
    {LABELS[status] ?? status}
  </span>
);

export default BookingStatusBadge;
