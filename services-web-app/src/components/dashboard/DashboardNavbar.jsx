import { useNavigate } from "react-router-dom";
import "../../styles/dashboard/dashboardNav.css";

const DashboardNavbar = () => {
  const navigate = useNavigate();

  const handleSwitchToProvider = () => {
    navigate("/provider-mode");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleBrowseServices = () => {
    navigate("/services");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="dash-nav-area">
      <ul className="dash-nav-left">
        <li><a href="/dashboard">Home</a></li>
        <li><button onClick={handleBrowseServices} className="nav-link-btn">Browse Services</button></li>
        <li><a href="/bookings">Bookings</a></li>
      </ul>

      <ul className="dash-nav-right">
        <li><button onClick={handleProfileClick} className="nav-link-btn">Profile</button></li>
        <li><a href="#" onClick={handleSwitchToProvider}>Switch to Provider Mode</a></li>
        <li><button onClick={handleLogout} className="nav-link-btn">Logout</button></li>
      </ul>
    </nav>
  );
};

export default DashboardNavbar;