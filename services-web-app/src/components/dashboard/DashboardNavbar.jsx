import { Link, useNavigate } from 'react-router-dom';
import "../../styles/dashboard/dashboardNav.css";
import { clearAuthSession } from "../../utils/auth.js";

const DashboardNavbar = () => { 
    const navigate = useNavigate();

    const handleSwitchToProvider = () => {
        navigate('/provider-mode');
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    const handleBrowseServices = () => {
        navigate('/services');
    };

    const handleLogout = () => {
        clearAuthSession();
        navigate('/login', { replace: true });
    };

    return (
        <nav className="dash-nav-area">
          <ul className="dash-nav-left">
            <li><Link to="/">Home</Link></li>
            <li><button onClick={handleBrowseServices} className="nav-link-btn">Browse Services</button></li>
            <li><Link to="/bookings">Bookings</Link></li>
          </ul>

          <ul className="dash-nav-right">
            <li><button onClick={handleProfileClick} className="nav-link-btn">Profile</button></li>
            <li>
                <button onClick={handleSwitchToProvider} className="nav-link-btn">
                    Switch to Provider Mode
                </button>
            </li>
            <li><button onClick={handleLogout} className="nav-link-btn">Logout</button></li>
          </ul>
        </nav>
    );
}

export default DashboardNavbar;
