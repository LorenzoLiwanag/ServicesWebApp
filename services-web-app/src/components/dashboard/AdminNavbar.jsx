import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/dashboard/dashboardNav.css";
import { clearAuthSession } from "../../utils/auth.js";
import NotificationBell from "../shared/NotificationBell.jsx";

const AdminNavbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

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

  return (
    <header className="dash-header-area">
      <div className="dash-navbar-area">
        <div className="dash-container">
          <nav className="dash-site-navbar" aria-label="Admin navigation">
            <Link to="/admin" className="dash-site-logo" onClick={closeMenu}>
              Works For You
            </Link>

            <ul
              id="admin-navigation"
              className={`dash-nav-menu ${open ? "open" : ""}`}
            >
              <li><Link to="/admin" onClick={closeMenu}>Admin Dashboard</Link></li>
              <li><Link to="/admin/messages" onClick={closeMenu}>Message Logs</Link></li>
              <li><button onClick={handleLogout} className="dash-nav-link-btn">Logout</button></li>
            </ul>

            <div className="dash-nav-actions">
              <NotificationBell />
            </div>

            <button
              className={`dash-nav-toggler ${open ? "toggler-open" : ""}`}
              aria-expanded={open}
              aria-controls="admin-navigation"
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

export default AdminNavbar;
