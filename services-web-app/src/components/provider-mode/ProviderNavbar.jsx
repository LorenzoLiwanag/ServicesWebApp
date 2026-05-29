import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/provider-mode/providerNavbar.css";
import { clearAuthSession } from "../../utils/auth.js";
import NotificationBell from "../shared/NotificationBell.jsx";

const ProviderNavbar = ({ isProviderMode = true }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  const handleProfile = () => {
    navigate("/profile");
    closeMenu();
  };

  const handleSwitchToClient = () => {
    navigate("/client-dashboard");
    closeMenu();
  };

  const handleMessages = () => {
    navigate("/messages");
    closeMenu();
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
    closeMenu();
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1050) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isProviderMode) {
    return null;
  }

  return (
    <header className="provider-header-area">
      <div className="provider-navbar-area">
        <div className="provider-navbar-container">
          <nav className="provider-site-navbar" aria-label="Provider navigation">
            <Link to="/" className="provider-site-logo" onClick={closeMenu}>
              Subic Bay Home Services
            </Link>

            <ul
              id="provider-main-navigation"
              className={`provider-nav-menu ${open ? "open" : ""}`}
            >
              <li><Link to="/" onClick={closeMenu}>Home</Link></li>
              <li><button onClick={handleMessages} className="provider-nav-link-btn">Messages</button></li>
              <li><button onClick={handleSwitchToClient} className="provider-nav-link-btn">Switch to Client Mode</button></li>
              <li><button onClick={handleProfile} className="provider-nav-link-btn">Profile</button></li>
              <li><button onClick={handleLogout} className="provider-nav-link-btn">Logout</button></li>
            </ul>

            <div className="provider-nav-actions">
              <NotificationBell />
            </div>

            <button
              className={`provider-nav-toggler ${open ? "toggler-open" : ""}`}
              aria-expanded={open}
              aria-controls="provider-main-navigation"
              aria-label="Toggle navigation menu"
              onClick={toggle}
            >
              <span aria-hidden="true"></span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default ProviderNavbar;
