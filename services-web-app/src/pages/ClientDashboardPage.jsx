import DashboardNavbar from "../components/DashboardNavbar";
import DashboardSearch from "../components/dashboardSearch";
const ClientDashboard = () => { 
    return (
        <div>
            <DashboardNavbar /> 
            <DashboardSearch /> 
            {/* <h1>Welcome Back User Name!</h1> */}
        </div>
    );
}   

export default ClientDashboard;