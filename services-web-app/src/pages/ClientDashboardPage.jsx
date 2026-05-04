// ClientDashboard.jsx
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import DashboardSearch from "../components/dashboard/DashboardSearch";
import DashboardServiceSection from "../components/dashboard/DashboardServiceSection";
import DashboardMyBookings from "../components/dashboard/DashboardMyBookings";
import { useEffect, useState } from "react";
import "../styles/dashboard/clientDashboard.css";

const ClientDashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  return (
    <div>
      <DashboardNavbar />
      <h1 className="welcome-heading">
        {user ? `Welcome back, ${user.fullName}` : "Welcome"}
      </h1>
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
};

export default ClientDashboard;
