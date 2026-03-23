import { useState, useEffect } from "react";
import ProviderNavbar from "../components/provider-mode/ProviderNavbar";
import ProviderModeHeader from "../components/provider-mode/ProviderModeHeader";
import ProviderRequestsWidget from "../components/provider-mode/ProviderRequestsWidget";
import ProviderUpcomingJobsWidget from "../components/provider-mode/ProviderUpcomingJobsWidget";
import ProviderServicesWidget from "../components/provider-mode/ProviderServicesWidget";
import ProviderQuickStats from "../components/provider-mode/ProviderQuickStats";
import "../styles/provider-mode/providerDashboard.css";

const ProviderDashboard = () => {
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchProviderProfile = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/provider/me", {
          method: "GET",
          headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load provider profile");
        }

        setProviderProfile(data.profile);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderProfile();
  }, []);

  const handleAvailabilityChange = async (isActive) => {
    try {
      const response = await fetch("http://localhost:3000/api/provider/me/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ is_provider_active: isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update availability");
      }

      // Update local state with the new availability
      setProviderProfile(prev => ({
        ...prev,
        is_provider_active: isActive
      }));
    } catch (err) {
      setError(err.message);
      // TODO: Show error to user (toast notification, etc.)
    }
  };

  if (loading) {
    return (
      <>
        <ProviderNavbar isProviderMode={true} />
        <div className="provider-dashboard">
          <div style={{ textAlign: "center", padding: "50px" }}>Loading provider profile...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ProviderNavbar isProviderMode={true} />
        <div className="provider-dashboard">
          <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
            Error: {error}
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
          {/* Left Column */}
          <div className="provider-column-left">
            <ProviderRequestsWidget />
            <ProviderUpcomingJobsWidget />
          </div>

          {/* Right Column */}
          <div className="provider-column-right">
            <ProviderQuickStats />
            <ProviderServicesWidget />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProviderDashboard;
