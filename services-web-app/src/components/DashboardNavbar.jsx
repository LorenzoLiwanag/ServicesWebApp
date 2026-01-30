import "../styles/dashboardNav.css";
const DashboardNavbar = () => { 
    return (
        <nav className="dash-nav-area">
          <ul className="dash-nav-left">
            <li><a href="/dashboard">Home</a></li>
            <li><a href="/services">Browse Services</a></li>
            <li><a href="/bookings">Bookings</a></li>
          </ul>

          <ul className="dash-nav-right">
            <li><a href="/profile">Profile</a></li>
            <li><a href="/provider-dashboard">Switch to Provider Mode</a></li>
            <li><a href="/logout">Logout</a></li>
          </ul>
        </nav>
    );
}

export default DashboardNavbar;