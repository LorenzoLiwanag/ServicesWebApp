// ProviderDashboard.jsx
import { useState, useEffect } from "react";
import ProviderNavbar from "../components/provider-mode/ProviderNavbar";
import ProviderModeHeader from "../components/provider-mode/ProviderModeHeader";
import ProviderRequestsWidget from "../components/provider-mode/ProviderRequestsWidget";
import ProviderUpcomingJobsWidget from "../components/provider-mode/ProviderUpcomingJobsWidget";
import ProviderServicesWidget from "../components/provider-mode/ProviderServicesWidget";
import { getStoredAuthSession } from "../utils/auth.js";
import { fetchProviderProfile, updateProviderProfile } from "../api/provider.js";
import "../styles/provider-mode/providerDashboard.css";

const ProviderDashboard = () => {
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [jobsRefreshKey, setJobsRefreshKey] = useState(0);

  const handleBookingResponded = () => setJobsRefreshKey((k) => k + 1);

  useEffect(() => {
    const session = getStoredAuthSession();
    if (!session) {
      setProfileError("Not authenticated");
      setLoading(false);
      return;
    }

    fetchProviderProfile(session.token)
      .then((profile) => {
        setProviderProfile(profile);
      })
      .catch((err) => {
        setProfileError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAvailabilityChange = async (isActive) => {
    if (!providerProfile) return;

    const session = getStoredAuthSession();
    if (!session) return;

    const previous = providerProfile.isProviderActive;
    setAvailabilityError(null);
    setAvailabilitySaving(true);

    // Optimistically update UI
    setProviderProfile((prev) => ({ ...prev, isProviderActive: isActive }));

    try {
      const updated = await updateProviderProfile(session.token, {
        displayName: providerProfile.displayName,
        bio: providerProfile.bio,
        isProviderActive: isActive,
      });
      setProviderProfile(updated);
    } catch (err) {
      // Revert on failure
      setProviderProfile((prev) => ({ ...prev, isProviderActive: previous }));
      setAvailabilityError("Failed to save availability. Please try again.");
    } finally {
      setAvailabilitySaving(false);
    }
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

  if (profileError) {
    return (
      <>
        <ProviderNavbar isProviderMode={true} />
        <div className="provider-dashboard">
          <div style={{ textAlign: "center", padding: "50px", color: "#dc2626" }}>
            {profileError}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderNavbar isProviderMode={true} />

      <div className="provider-dashboard">
        <ProviderModeHeader />

        <div className="provider-content-wrapper">
          <div className="provider-column-left">
            <ProviderRequestsWidget onResponded={handleBookingResponded} />
            <ProviderUpcomingJobsWidget refreshKey={jobsRefreshKey} />
          </div>

          <div className="provider-column-right">
            <ProviderServicesWidget
              providerProfile={providerProfile}
              onAvailabilityChange={handleAvailabilityChange}
              availabilitySaving={availabilitySaving}
              availabilityError={availabilityError}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProviderDashboard;
