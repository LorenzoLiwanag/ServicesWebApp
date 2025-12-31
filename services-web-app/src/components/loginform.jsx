import { Link } from "react-router-dom";
import "../styles/login.css";

const LoginForm = () => {
  return (
    <div className="login-page">
      <div className="login-card">

        {/* LEFT PANEL */}
        <div className="login-left">
          <h1>Login to your account</h1>
          <p>
            Access your Subic Bay Home Services dashboard to manage services,
            bookings, and requests all in one place.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="login-right">
          <form className="loginForm">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-btn">
              Login
            </button>

            <div className="login-links">
              <Link to="/register">Don’t have an account? Register</Link>
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
