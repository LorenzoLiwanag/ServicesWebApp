import { useState } from "react";
import ContactModal from "../messaging/ContactModal";
import "../../styles/dashboard/dashboardBookings.css";

// Upcoming booking rows: each entry needs { id, providerId } when real booking data is wired in.
const upcomingBookings = [
  { id: 1, providerId: null, date: "Thursday February 12, 2026", service: "Deep house and yard cleaning", provider: "Sara D", status: "confirmed" },
];

// History rows: each entry needs { id, providerId } when real booking data is wired in.
const historyBookings = [
  { id: 1, providerId: null, date: "Monday January 5, 2026", service: "Plumbing repair", provider: "Juan Dela Cruz" },
];

const DashboardMyBookings = () => {
  const [modal, setModal] = useState(null); // { recipientId, bookingId }

  return (
        <>
        <div className="bookings-area">

            {/* Section Header */}
            <div className="bookings-header">
                <h2>My Bookings</h2>
            </div>

            {/* Two Widget Layout */}
            <div className="bookings-containers">

                {/* UPCOMING WIDGET */}
                <div className="bookings-widget upcoming-widget">

                    <div className="widget-header">
                        <h3 className="widget-heading">Upcoming Schedule</h3>
                        <span className="widget-badge">{upcomingBookings.length}</span>
                    </div>

                    {upcomingBookings.map((booking) => (
                        <div key={booking.id} className="booking-row">
                            <div className="booking-info">
                                <p className="widget-date">{booking.date}</p>
                                <p className="widget-service">{booking.service}</p>
                                <p className="widget-provider">{booking.provider}</p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                                <span className={`status-badge ${booking.status}`}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                                <button
                                    className="btn-contact"
                                    style={{ fontSize: "12px", padding: "4px 10px" }}
                                    onClick={() => setModal({ recipientId: booking.providerId, bookingId: booking.id })}
                                >
                                    Contact
                                </button>
                            </div>
                        </div>
                    ))}

                    <button className="view-all-button">
                        View all bookings
                    </button>

                </div>

                {/* HISTORY WIDGET */}
                <div className="bookings-widget history-widget">

                    <div className="widget-header">
                        <h3 className="widget-heading">Recent Services</h3>
                        <span className="widget-badge">{historyBookings.length}</span>
                    </div>

                    {historyBookings.map((booking) => (
                        <div key={booking.id} className="history-card">

                            <div className="booking-info">
                                <p className="widget-date">{booking.date}</p>
                                <p className="widget-service">{booking.service}</p>
                                <p className="widget-provider">{booking.provider}</p>
                            </div>

                            <div className="history-actions">
                                <button className="re-book-button">
                                    Book Again
                                </button>

                                <button className="review-button">
                                    Leave Review
                                </button>

                                <button
                                    className="btn-contact"
                                    style={{ fontSize: "12px", padding: "4px 10px" }}
                                    onClick={() => setModal({ recipientId: booking.providerId, bookingId: booking.id })}
                                >
                                    Contact
                                </button>
                            </div>

                        </div>
                    ))}

                </div>

            </div>

        </div>

        <ContactModal
            isOpen={modal !== null}
            onClose={() => setModal(null)}
            recipientId={modal?.recipientId}
            bookingId={modal?.bookingId}
        />
        </>
    );
}

export default DashboardMyBookings;
