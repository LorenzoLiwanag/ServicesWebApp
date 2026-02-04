import DashboardNavbar from "../components/DashboardNavbar";
import DashboardSearch from "../components/dashboardSearch";
import DashboardServiceSection from "../components/dashboardServiceSection";
import DashboardMyBookings from "../components/dashboardMyBookings";    
const ClientDashboard = () => { 
    return (
        <div>
            <DashboardNavbar /> 
            <h1>Welcome Back User!</h1>
            <DashboardSearch /> 
            <DashboardServiceSection /> 
            <DashboardMyBookings />

        </div>
    );
}   

export default ClientDashboard;