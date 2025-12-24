import React, { useState, useEffect } from "react";
import "../styles/navbar.css";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((prev) => !prev);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768 && open) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <header className="header-area">
      <div className="navbar-area">
        <div className="container">
          <nav className="site-navbar" aria-label="Main navigation">
            <a href="#home" className="site-logo">
              Subic Bay Home Services
            </a>

            <ul
              id="main-navigation"
              className={`nav-menu ${open ? "open" : ""}`}
            >
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#contact">Contact</a></li>

              {/* Mobile-only buttons inside dropdown */}
              <li className="nav-actions nav-actions-mobile">
                <a className="nav-btn nav-btn-primary" href="#services">Get Started</a>
                <a className="nav-btn nav-btn-ghost" href="#login">Login</a>
              </li>
            </ul>

            {/* Desktop buttons on the right */}
            <div className="nav-actions nav-actions-desktop">
              <a className="nav-btn nav-btn-primary" href="#services">Get Started</a>
              <a className="nav-btn nav-btn-ghost" href="#login">Login</a>
            </div>

            <button
              className={`nav-toggler ${open ? "toggler-open" : ""}`}
              aria-expanded={open}
              aria-controls="main-navigation"
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
