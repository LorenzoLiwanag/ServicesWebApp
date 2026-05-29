import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthHomeButton from "../shared/AuthHomeButton.jsx";
import "../../styles/login/login.css";

const LoginForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
      } else {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        if (data.user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/client-dashboard");
        }
      }

    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Link to="/" className="auth-home-link" aria-label="Go to landing page">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-7h6v7" />
        </svg>
      </Link>

      <div className="login-card">

        <div className="login-left">
          <h1>Login to your account</h1>
          <p>
            Access your Subic Bay Home Services dashboard to manage services,
            bookings, and requests all in one place.
          </p>
        </div>

        <div className="login-right">
          <form className="loginForm" onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

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
