import ProviderModeHeader from "../components/provider-mode/ProviderModeHeader";
import ProviderRequestsWidget from "../components/provider-mode/ProviderRequestsWidget";
import ProviderUpcomingJobsWidget from "../components/provider-mode/ProviderUpcomingJobsWidget";
import ProviderServicesWidget from "../components/provider-mode/ProviderServicesWidget";
import ProviderQuickStats from "../components/provider-mode/ProviderQuickStats";
import "../styles/provider-mode/providerDashboard.css";

const ProviderDashboard = () => {
  return (
    <div className="provider-dashboard">
      <ProviderModeHeader />
      
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
  );
};

export default ProviderDashboard;
