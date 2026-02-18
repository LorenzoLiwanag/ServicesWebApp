import React from "react";
import "../../styles/provider-mode/providerSummaryBar.css";

const ProviderSummaryBar = () => {
  // Mock data
  const newRequests = 3;
  const jobsToday = 2;
  const nextJobTime = "2:30 PM";

  return (
    <div className="provider-summary-bar">
      <div className="summary-card">
        <div className="summary-card-icon requests-icon">
          <span>📋</span>
        </div>
        <div className="summary-card-content">
          <p className="summary-card-label">New Requests</p>
          <p className="summary-card-value">{newRequests}</p>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-card-icon jobs-icon">
          <span>📅</span>
        </div>
        <div className="summary-card-content">
          <p className="summary-card-label">Jobs Today</p>
          <p className="summary-card-value">{jobsToday}</p>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-card-icon next-job-icon">
          <span>⏰</span>
        </div>
        <div className="summary-card-content">
          <p className="summary-card-label">Next Job</p>
          <p className="summary-card-value">{nextJobTime}</p>
        </div>
      </div>
    </div>
  );
};

export default ProviderSummaryBar;
