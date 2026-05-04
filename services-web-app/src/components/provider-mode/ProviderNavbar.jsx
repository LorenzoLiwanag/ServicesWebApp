import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/provider-mode/providerNavbar.css";
import { clearAuthSession } from "../../utils/auth.js";

const ProviderNavbar = ({ isProviderMode = true }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => setOpen((prev) => !prev);

  const handleProviderHome = () => {
    navigate("/provider-dashboard");
    setOpen(false);
  };

  const handleJobsScroll = () => {
    // Scroll to jobs section
    const element = document.querySelector(".provider-column-left");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  const handleServicesScroll = () => {
    // Scroll to services widget
    const element = document.querySelector(".provider-column-right");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  const handleProfile = () => {
    navigate("/profile");
    setOpen(false);
  };

  const handleSwitchToClient = () => {
    navigate("/client-dashboard");
    setOpen(false);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
    setOpen(false);
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768 && open) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  if (!isProviderMode) {
    // Return regular navbar
    return null;
  }

  return (
    <header className="provider-header-area">
      <div className="provider-navbar-area">
        <div className="provider-navbar-container">
          <nav className="provider-site-navbar" aria-label="Provider navigation">
            <a href="/provider-dashboard" className="provider-site-logo">
              Subic Bay Home Services
            </a>

            <ul
              id="provider-main-navigation"
              className={`provider-nav-menu ${open ? "open" : ""}`}
            >
              <li>
                <button onClick={handleProviderHome} className="nav-link">
                  Provider Home
                </button>
              </li>
              <li>
                <button onClick={handleJobsScroll} className="nav-link">
                  Jobs
                </button>
              </li>
              <li>
                <button onClick={handleServicesScroll} className="nav-link">
                  My Services
                </button>
              </li>

              {/* Mobile-only actions inside dropdown */}
              <li className="provider-nav-actions provider-nav-actions-mobile">
                <button 
                  className="provider-nav-btn provider-nav-btn-secondary" 
                  onClick={handleProfile}
                >
                  Profile
                </button>
                <button 
                  className="provider-nav-btn provider-nav-btn-secondary" 
                  onClick={handleSwitchToClient}
                >
                  Client Mode
                </button>
                <button 
                  className="provider-nav-btn provider-nav-btn-danger" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            </ul>

            {/* Desktop buttons on the right */}
            <div className="provider-nav-actions provider-nav-actions-desktop">
              <button 
                className="provider-nav-btn provider-nav-btn-secondary" 
                onClick={handleProfile}
              >
                Profile
              </button>
              <button 
                className="provider-nav-btn provider-nav-btn-secondary" 
                onClick={handleSwitchToClient}
              >
                Switch to Client Mode
              </button>
              <button 
                className="provider-nav-btn provider-nav-btn-danger" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

            <button
              className={`provider-nav-toggler ${open ? "toggler-open" : ""}`}
              aria-expanded={open}
              aria-controls="provider-main-navigation"
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
