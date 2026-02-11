import "../../styles/dashboard/dashboardBookings.css";

const DashboardMyBookings = () => {
    return (
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
                        <span className="widget-badge">1</span>
                    </div>

                    <div className="booking-row">
                        <div className="booking-info">
                            <p className="widget-date">Thursday February 12, 2026</p>
                            <p className="widget-service">Deep house and yard cleaning</p>
                            <p className="widget-provider">Sara D</p>
                        </div>

                        <span className="status-badge confirmed">
                            Confirmed
                        </span>
                    </div>

                    <button className="view-all-button">
                        View all bookings
                    </button>

                </div>

                {/* HISTORY WIDGET */}
                <div className="bookings-widget history-widget">

                    <div className="widget-header">
                        <h3 className="widget-heading">Recent Services</h3>
                        <span className="widget-badge">1</span>
                    </div>

                    <div className="history-card">

                        <div className="booking-info">
                            <p className="widget-date">Monday January 5, 2026</p>
                            <p className="widget-service">Plumbing repair</p>
                            <p className="widget-provider">Juan Dela Cruz</p>
                        </div>

                        <div className="history-actions">
                            <button className="re-book-button">
                                Book Again
                            </button>

                            <button className="review-button">
                                Leave Review
                            </button>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default DashboardMyBookings;
