import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDashboardPath, getStoredAuthSession } from "../../utils/auth.js";
import "../../styles/login/login.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const LoginForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Already-authenticated users shouldn't land back on the login form.
  useEffect(() => {
    const session = getStoredAuthSession();
    if (session) {
      navigate(getDashboardPath(session.user), { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
      } else {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        navigate(getDashboardPath(data.user));
      }

    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <span className="auth-bubble auth-bubble-dot auth-bubble-1" />
      <span className="auth-bubble auth-bubble-ring auth-bubble-2" />
      <span className="auth-bubble auth-bubble-dot auth-bubble-3" />
      <span className="auth-bubble auth-bubble-ring auth-bubble-4" />
      <span className="auth-bubble auth-bubble-dot auth-bubble-5" />
      <span className="auth-bubble auth-bubble-ring auth-bubble-6" />
      <span className="auth-bubble auth-bubble-dot auth-bubble-7" />
      <span className="auth-bubble auth-bubble-ring auth-bubble-8" />
      <span className="auth-bubble auth-bubble-dot auth-bubble-9" />
      <span className="auth-bubble auth-bubble-ring auth-bubble-10" />
      <span className="auth-bubble auth-bubble-dot auth-bubble-11" />
      <span className="auth-bubble auth-bubble-ring auth-bubble-12" />

      <Link to="/" className="auth-home-link" aria-label="Go to landing page">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-7h6v7" />
        </svg>
        <span className="auth-home-text">Back to home</span>
      </Link>

      <div className="login-card">

        <div className="login-left">
          <h1>Login to your account</h1>
          <p>
            Access your Works For You dashboard to manage services,
            bookings, and requests all in one place.
          </p>
        </div>

        <div className="login-right">
          <form className="loginForm" onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="login-links">
              <Link to="/register">Don't have an account? Register</Link>
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
