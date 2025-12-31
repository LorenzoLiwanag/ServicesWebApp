import { Link } from "react-router-dom";
import "../styles/registration.css";

const RegistrationForm = () => {
  return (
    <div className="registration-page">
      <div className="registration-card">

        {/* LEFT PANEL */}
        <div className="registration-left">
          <h1>Create your account</h1>
          <p>
            Join Subic Bay Home Services today to access a wide range of home
            services and manage your bookings with ease.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="registration-right">
          <form className="registrationForm">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Create a password"
                required
              />
            </div>

            <button type="submit" className="submit-btn">
              Register
            </button>

            <div className="login-links">
              <Link to="/login">Already have an account? Login</Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default RegistrationForm;
