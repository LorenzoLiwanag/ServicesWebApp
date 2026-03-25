// ProviderModeHeader.jsx
import { useEffect, useState } from "react";
import "../../styles/provider-mode/providerModeHeader.css";

const ProviderModeHeader = ({ providerProfile, onAvailabilityChange }) => {
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (providerProfile) {
      setIsAvailable(providerProfile.is_provider_active ?? true);
    }
  }, [providerProfile]);

  const handleToggle = () => {
    const updatedValue = !isAvailable;
    setIsAvailable(updatedValue);

    if (onAvailabilityChange) {
      onAvailabilityChange(updatedValue);
    }
  };

  return (
    <div className="provider-header">
      <div className="provider-header-left">
        <h1 className="provider-title">
          Provider Mode
          {providerProfile?.display_name ? ` — ${providerProfile.display_name}` : ""}
        </h1>
        <p className="provider-subtitle">
          {providerProfile?.bio || "Manage your services and bookings"}
        </p>
      </div>

      <div className="provider-header-right">
        <div className="availability-section">
          <span className="availability-label">Available to clients</span>
          <button
            className={`availability-toggle ${isAvailable ? "active" : ""}`}
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