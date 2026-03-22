import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import DashboardSearch from "../components/dashboard/DashboardSearch";
import DashboardServiceSection from "../components/dashboard/DashboardServiceSection";
import DashboardMyBookings from "../components/dashboard/DashboardMyBookings";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard/clientDashboard.css";

const ClientDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  return (
    <div>
      <DashboardNavbar />
      <div className="dashboard-top-section">
        <h2 className="welcome-heading">
          {user ? `Welcome back, ${user.fullName}` : "Welcome"}
        </h2>
      </div>
      <div className="dashboard-search-wrapper">
        <DashboardSearch />
      </div>
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
};

export default ClientDashboard;