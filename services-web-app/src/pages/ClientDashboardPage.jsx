import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import DashboardSearch from "../components/dashboard/DashboardSearch";
import DashboardServiceSection from "../components/dashboard/DashboardServiceSection";
import DashboardMyBookings from "../components/dashboard/DashboardMyBookings";
import "../styles/dashboard/clientDashboard.css";    
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