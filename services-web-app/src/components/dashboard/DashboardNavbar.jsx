import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../../styles/dashboard/dashboardNav.css";
import { clearAuthSession } from "../../utils/auth.js";
import NotificationBell from "../shared/NotificationBell.jsx";

const DashboardNavbar = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const toggle = () => setOpen((prev) => !prev);
    const closeMenu = () => setOpen(false);

    const handleSwitchToProvider = () => {
        navigate('/provider-mode');
        closeMenu();
    };

    const handleProfileClick = () => {
        navigate('/profile');
        closeMenu();
    };

    const handleLogout = () => {
        clearAuthSession();
        navigate('/login', { replace: true });
        closeMenu();
    };

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth > 1050) {
                setOpen(false);
            }
        };

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <header className="dash-header-area">
          <div className="dash-navbar-area">
            <div className="dash-container">
              <nav className="dash-site-navbar" aria-label="Dashboard navigation">
                <Link to="/" className="dash-site-logo" onClick={closeMenu}>
                  Works For You
                </Link>

                <ul
                  id="dashboard-navigation"
                  className={`dash-nav-menu ${open ? "open" : ""}`}
                >
                  <li><Link to="/" onClick={closeMenu}>Home</Link></li>
                  <li><Link to="/services" onClick={closeMenu}>Browse Services</Link></li>
                  <li><Link to="/client-dashboard#my-bookings" onClick={closeMenu}>My Bookings</Link></li>
                  <li><Link to="/messages" onClick={closeMenu}>Messages</Link></li>
                  <li><button onClick={handleSwitchToProvider} className="dash-nav-link-btn">Switch to Provider Mode</button></li>
                  <li><button onClick={handleProfileClick} className="dash-nav-link-btn">Profile</button></li>
                  <li><button onClick={handleLogout} className="dash-nav-link-btn">Logout</button></li>
                </ul>

                <div className="dash-nav-actions">
                  <NotificationBell />
                </div>

                <button
                  className={`dash-nav-toggler ${open ? "toggler-open" : ""}`}
                  aria-expanded={open}
                  aria-controls="dashboard-navigation"
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
}

export default DashboardNavbar;
