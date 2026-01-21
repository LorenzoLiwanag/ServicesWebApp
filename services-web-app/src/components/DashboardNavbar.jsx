import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard-navbar.css";

const DashboardNavbar = ({ userName = "User", isProvider = false }) => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => setOpen((prev) => !prev);
  const toggleProfile = () => setProfileOpen((prev) => !prev);

  const handleLogout = () => {
    // Add logout logic here
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/dashboard/profile");
    setProfileOpen(false);
  };

  const handleSettings = () => {
    navigate("/dashboard/settings");
    setProfileOpen(false);
  };

  const handleServices = () => {
    navigate("/Services");
    setOpen(false);
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768 && open) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <header className="dashboard-header">
      <div className="dashboard-navbar">
        <div className="navbar-container">
          {/* Logo/Branding */}
          <div className="navbar-brand">
            <a href="/dashboard" className="brand-logo">
              <span className="logo-icon">🏠</span>
              Services
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`hamburger-menu ${open ? "open" : ""}`}
            onClick={toggle}
            aria-label="Toggle navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Navigation Menu */}
          <nav className={`navbar-menu ${open ? "open" : ""}`}>
            <ul className="nav-links">
              <li>
                <a href="/Services" onClick={handleServices}>
                  Services
                </a>
              </li>
              <li>
                <a href="/dashboard/bookings">Bookings</a>
              </li>
              {isProvider && (
                <li>
                  <a href="/dashboard/my-services">My Services</a>
                </li>
              )}
              <li>
                <a href="/dashboard/messages">Messages</a>
              </li>
            </ul>
          </nav>

          {/* User Profile Section */}
          <div className="navbar-profile">
            <div className="profile-dropdown">
              <button
                className="profile-btn"
                onClick={toggleProfile}
                aria-label="User menu"
              >
                <span className="avatar">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{userName}</span>
                <span className={`dropdown-icon ${profileOpen ? "open" : ""}`}>
                  ▼
                </span>
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <a href="/dashboard/profile" onClick={handleProfile}>
                    👤 My Profile
                  </a>
                  <a href="/dashboard/settings" onClick={handleSettings}>
                    ⚙️ Settings
                  </a>
                  <hr />
                  <button onClick={handleLogout} className="logout-btn">
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button className="notification-btn" aria-label="Notifications">
              🔔
              <span className="notification-badge">3</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
