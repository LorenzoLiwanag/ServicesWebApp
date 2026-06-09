// ProviderModeHeader.jsx
import { useEffect, useState } from "react";
import "../../styles/provider-mode/providerModeHeader.css";

const ProviderModeHeader = ({ providerProfile, onAvailabilityChange, saving, saveError }) => {
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (providerProfile) {
      setIsAvailable(providerProfile.isProviderActive ?? true);
    }
  }, [providerProfile]);

  const handleToggle = () => {
    if (saving) return;
    const updatedValue = !isAvailable;
    setIsAvailable(updatedValue);

    if (onAvailabilityChange) {
      onAvailabilityChange(updatedValue);
    }
  };

  return (
    <div className="provider-header">
      <div className="provider-header-left">
        <h1 className="provider-title">Provider Dashboard</h1>
        <p className="provider-subtitle">
          {providerProfile?.bio || "No provider bio added yet."}
        </p>
      </div>

      <div className="provider-header-right">
        <div className="availability-section">
          <span className="availability-label">Available to clients</span>
          <button
            className={`availability-toggle ${isAvailable ? "active" : ""} ${saving ? "saving" : ""}`}
            onClick={handleToggle}
            aria-label="Toggle availability"
            disabled={saving}
          >
            <span className="toggle-circle"></span>
          </button>
          <p className="availability-hint">
            {saving
              ? "Saving..."
              : isAvailable
              ? "Your services are visible to clients"
              : "Your services are hidden from search"}
          </p>
        </div>
        {saveError && (
          <p className="availability-save-error">{saveError}</p>
        )}
      </div>
    </div>
  );
};

export default ProviderModeHeader;
