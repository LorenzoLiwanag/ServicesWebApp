import DashboardNavbar from "../components/DashboardNavbar";
import DashboardSearch from "../components/dashboardSearch";
import DashboardServiceSection from "../components/dashboardServiceSection";
const ClientDashboard = () => { 
    return (
        <div>
            <DashboardNavbar /> 
            <h1>Welcome Back User!</h1>
            <DashboardSearch /> 
            <DashboardServiceSection /> 
            {/* <h1>Welcome Back User Name!</h1> */}
        </div>
    );
}   

export default ClientDashboard;