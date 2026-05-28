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
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div>
      <DashboardNavbar />
      <h1 className="welcome-heading">
        {fullName ? `Welcome back, ${fullName}` : "Welcome back"}
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
