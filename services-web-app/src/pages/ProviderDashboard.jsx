import ProviderNavbar from "../components/provider-mode/ProviderNavbar";
import ProviderModeHeader from "../components/provider-mode/ProviderModeHeader";
import ProviderSummaryBar from "../components/provider-mode/ProviderSummaryBar";
import ProviderQuickActions from "../components/provider-mode/ProviderQuickActions";
import ProviderRequestsWidget from "../components/provider-mode/ProviderRequestsWidget";
import ProviderUpcomingJobsWidget from "../components/provider-mode/ProviderUpcomingJobsWidget";
import ProviderServicesWidget from "../components/provider-mode/ProviderServicesWidget";
import ProviderQuickStats from "../components/provider-mode/ProviderQuickStats";
import "../styles/provider-mode/providerDashboard.css";

const ProviderDashboard = () => {
  return (
    <>
      <ProviderNavbar isProviderMode={true} />
      
      <div className="provider-dashboard">
        <ProviderModeHeader />
        <ProviderSummaryBar />
        <ProviderQuickActions />
        
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
