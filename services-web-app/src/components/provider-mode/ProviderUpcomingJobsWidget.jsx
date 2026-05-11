import { useState } from "react";
import ContactModal from "../messaging/ContactModal";
import "../../styles/provider-mode/providerUpcomingJobsWidget.css";

// clientId will be populated from real booking data when the bookings API is wired in.
const upcomingJobs = [
  { id: 1, clientId: null, serviceName: "Deep House Cleaning", clientName: "Robert Martinez", time: "Saturday at 9:00 AM", status: "confirmed" },
  { id: 2, clientId: null, serviceName: "Lawn Mowing", clientName: "Linda Thompson", time: "Sunday at 10:00 AM", status: "confirmed" },
  { id: 3, clientId: null, serviceName: "Electrical Repairs", clientName: "Michael Chen", time: "Monday at 2:00 PM", status: "pending" },
];

const ProviderUpcomingJobsWidget = () => {
  const [modal, setModal] = useState(null); // { recipientId, bookingId }

  return (
    <div className="upcoming-jobs-widget">
      <div className="widget-header">
        <h2 className="widget-title">Upcoming Jobs</h2>
        <span className="jobs-badge">{upcomingJobs.length}</span>
      </div>

      <div className="jobs-list">
        {upcomingJobs.length === 0 ? (
          <p className="empty-state">No upcoming jobs scheduled</p>
        ) : (
          upcomingJobs.map((job) => (
            <div key={job.id} className="job-item">
              <div className="job-info">
                <h3 className="job-service">{job.serviceName}</h3>
                <p className="job-client">Client: {job.clientName}</p>
                <p className="job-time">{job.time}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                <span className={`status-badge status-${job.status}`}>
                  {job.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
                </span>
                <button
                  className="btn-contact"
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                  onClick={() => setModal({ recipientId: job.clientId, bookingId: job.id })}
                >
                  Contact
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ContactModal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        recipientId={modal?.recipientId}
        bookingId={modal?.bookingId}
      />
    </div>
  );
};

export default ProviderUpcomingJobsWidget;
