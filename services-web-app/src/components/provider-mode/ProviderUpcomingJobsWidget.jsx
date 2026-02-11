import "../../styles/provider-mode/providerUpcomingJobsWidget.css";

const ProviderUpcomingJobsWidget = () => {
  const upcomingJobs = [
    {
      id: 1,
      serviceName: "Deep House Cleaning",
      clientName: "Robert Martinez",
      time: "Saturday at 9:00 AM",
      status: "confirmed",
    },
    {
      id: 2,
      serviceName: "Lawn Mowing",
      clientName: "Linda Thompson",
      time: "Sunday at 10:00 AM",
      status: "confirmed",
    },
    {
      id: 3,
      serviceName: "Electrical Repairs",
      clientName: "Michael Chen",
      time: "Monday at 2:00 PM",
      status: "pending",
    },
  ];

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

              <span className={`status-badge status-${job.status}`}>
                {job.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProviderUpcomingJobsWidget;
