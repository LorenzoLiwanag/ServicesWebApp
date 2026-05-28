// ProviderDashboard.jsx
import { useState, useEffect } from "react";
import ProviderNavbar from "../components/provider-mode/ProviderNavbar";
import ProviderModeHeader from "../components/provider-mode/ProviderModeHeader";
import ProviderRequestsWidget from "../components/provider-mode/ProviderRequestsWidget";
import ProviderUpcomingJobsWidget from "../components/provider-mode/ProviderUpcomingJobsWidget";
import ProviderServicesWidget from "../components/provider-mode/ProviderServicesWidget";
import "../styles/provider-mode/providerDashboard.css";

const ProviderDashboard = () => {
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser) {
      setProviderProfile({
        provider_id: storedUser.id,
        display_name: storedUser.fullName || "Provider",
        bio: "Manage your services and bookings",
        is_provider_active: true,
      });
    }

    setLoading(false);
  }, []);

  const handleAvailabilityChange = (isActive) => {
    setProviderProfile((prev) => ({
      ...prev,
      is_provider_active: isActive,
    }));
  };

  if (loading) {
    return (
      <>
        <ProviderNavbar isProviderMode={true} />
        <div className="provider-dashboard">
          <div style={{ textAlign: "center", padding: "50px" }}>
            Loading provider profile...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderNavbar isProviderMode={true} />

      <div className="provider-dashboard">
        <ProviderModeHeader
          providerProfile={providerProfile}
          onAvailabilityChange={handleAvailabilityChange}
        />

        <div className="provider-content-wrapper">
          <div className="provider-column-left">
            <ProviderRequestsWidget />
            <ProviderUpcomingJobsWidget />
          </div>

          <div className="provider-column-right">
            <ProviderServicesWidget />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProviderDashboard;
