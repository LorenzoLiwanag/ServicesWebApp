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
        <li>
          <button onClick={() => navigate('/')} className="nav-link-btn">
            Home
          </button>
        </li>
        <li>
          <button onClick={handleBrowseServices} className="nav-link-btn">
            Browse Services
          </button>
        </li>
        <li>
          <button className="nav-link-btn" disabled>
            Bookings
          </button>
        </li>
      </ul>

      <ul className="dash-nav-right">
        <li>
          <button onClick={handleProfileClick} className="nav-link-btn">
            Profile
          </button>
        </li>
        <li>
          <button onClick={handleSwitchToProvider} className="nav-link-btn">
            Switch to Provider Mode
          </button>
        </li>
        <li>
          <button onClick={handleLogout} className="nav-link-btn">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default DashboardNavbar;