// ClientDashboard.jsx
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import DashboardSearch from "../components/dashboard/DashboardSearch";
import DashboardServiceSection from "../components/dashboard/DashboardServiceSection";
import DashboardMyBookings from "../components/dashboard/DashboardMyBookings";
import { useEffect, useState } from "react";
import { getUserFullName } from "../utils/auth.js";
import "../styles/dashboard/clientDashboard.css";

const ClientDashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  useEffect(() => {
    if (window.location.hash === "#my-bookings") {
      requestAnimationFrame(() => {
        document.getElementById("my-bookings")?.scrollIntoView();
      });
    }
  }, []);

  const fullName = getUserFullName(user);

  return (
    <div className="client-dashboard-page">
      <DashboardNavbar />
      <h1 className="welcome-heading">
        {fullName ? `Welcome back, ${fullName}` : "Welcome back"}
      </h1>
      <DashboardSearch />
      <div className="dashboard-content-wrapper">
        <div className="dashboard-bookings-column">
          <DashboardMyBookings />
        </div>
      </div>
      <div className="dashboard-featured-wrapper">
        <DashboardServiceSection />
      </div>
    </div>
  );
};

export default ClientDashboard;
