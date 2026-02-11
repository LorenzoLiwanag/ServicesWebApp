import DashboardNavbar from "../components/DashboardNavbar";
import DashboardSearch from "../components/dashboardSearch";
import DashboardServiceSection from "../components/dashboardServiceSection";
import DashboardMyBookings from "../components/dashboardMyBookings";
import "../styles/clientDashboard.css";    
const ClientDashboard = () => { 
    return (
        <div>
            <DashboardNavbar /> 
            <h1 className="welcome-heading">Welcome Back User!</h1>
            <DashboardSearch /> 
            <div className="dashboard-content-wrapper">
                <div className="dashboard-services-column">
                    <DashboardServiceSection /> 
                </div>
                <div className="dashboard-bookings-column">
                    <DashboardMyBookings />
                </div>
            </div>
        </div>
    );
}   

export default ClientDashboard;