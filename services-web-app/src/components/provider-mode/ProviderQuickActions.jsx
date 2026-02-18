import React from "react";
import "../../styles/provider-mode/providerQuickActions.css";

const ProviderQuickActions = () => {
  const handleAddService = () => {
    console.log("Add Service clicked");
    // TODO: Navigate to add service page or open modal
  };

  const handleSetAvailability = () => {
    console.log("Set Availability clicked");
    // TODO: Open availability settings
  };

  const handleViewCalendar = () => {
    console.log("View Calendar clicked");
    // TODO: Navigate to calendar view
  };

  return (
    <div className="provider-quick-actions">
      <button 
        className="quick-action-btn add-service-btn"
        onClick={handleAddService}
      >
        <span className="btn-icon">+</span>
        <span className="btn-text">Add Service</span>
      </button>

      <button 
        className="quick-action-btn set-availability-btn"
        onClick={handleSetAvailability}
      >
        <span className="btn-icon">⚙️</span>
        <span className="btn-text">Set Availability</span>
      </button>

      <button 
        className="quick-action-btn view-calendar-btn"
        onClick={handleViewCalendar}
      >
        <span className="btn-icon">📆</span>
        <span className="btn-text">View Calendar</span>
      </button>
    </div>
  );
};

export default ProviderQuickActions;
