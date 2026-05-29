import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/shared/navbar.css";
import { getDashboardPath, getStoredAuthSession } from "../../utils/auth.js";

const NAV_BREAKPOINT = 1050;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const authSession = getStoredAuthSession();
  const dashboardPath = authSession ? getDashboardPath(authSession.user) : null;

  const toggle = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > NAV_BREAKPOINT) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="header-area">
      <div className="navbar-area">
        <div className="container">
          <nav className="site-navbar" aria-label="Main navigation">
            <a href="#home" className="site-logo" onClick={closeMenu}>
              Subic Bay Home Services
            </a>

            <ul
              id="main-navigation"
              className={`nav-menu ${open ? "open" : ""}`}
            >
              <li><a href="#home" onClick={closeMenu}>Home</a></li>
              <li><a href="#about" onClick={closeMenu}>About</a></li>
              <li><a href="#services" onClick={closeMenu}>Services</a></li>
              <li><a href="#contact" onClick={closeMenu}>Contact</a></li>

              <li className="nav-actions nav-actions-mobile">
                {authSession ? (
                  <Link className="nav-btn nav-btn-ghost" to={dashboardPath} onClick={closeMenu}>Dashboard</Link>
                ) : (
                  <>
                    <Link className="nav-btn nav-btn-primary" to="/register" onClick={closeMenu}>Get Started</Link>
                    <Link className="nav-btn nav-btn-ghost" to="/login" onClick={closeMenu}>Login</Link>
                  </>
                )}
              </li>
            </ul>

            <div className="nav-actions nav-actions-desktop">
              {authSession ? (
                <Link className="nav-btn nav-btn-ghost" to={dashboardPath}>Dashboard</Link>
              ) : (
                <>
                  <Link className="nav-btn nav-btn-primary" to="/register">Get Started</Link>
                  <Link className="nav-btn nav-btn-ghost" to="/login">Login</Link>
                </>
              )}
            </div>

            <button
              className={`nav-toggler ${open ? "toggler-open" : ""}`}
              aria-expanded={open}
              aria-controls="main-navigation"
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

export default Navbar;
