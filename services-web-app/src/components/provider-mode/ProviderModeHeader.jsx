import { useState } from "react";
import "../../styles/provider-mode/providerModeHeader.css";

const ProviderModeHeader = () => {
  const [isAvailable, setIsAvailable] = useState(true);

  const handleToggle = () => {
    setIsAvailable(!isAvailable);
  };

  return (
    <div className="provider-header">
      <div className="provider-header-left">
        <h1 className="provider-title">Provider Mode</h1>
        <p className="provider-subtitle">Manage your services and bookings</p>
      </div>

      <div className="provider-header-right">
        <div className="availability-section">
          <span className="availability-label">Available to clients</span>
          <button 
            className={`availability-toggle ${isAvailable ? 'active' : ''}`}
            onClick={handleToggle}
            aria-label="Toggle availability"
          >
            <span className="toggle-circle"></span>
          </button>
          <p className="availability-hint">
            {isAvailable 
              ? "✓ Your services are visible to clients" 
              : "✗ Your services are hidden from search"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProviderModeHeader;
