import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/login/login.css";

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("This reset link is invalid or expired. Please request a new one.");
      return;
    }

    const errors = {};
    if (!formData.newPassword) errors.newPassword = "New password is required";
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
    if (formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (formData.newPassword && !PASSWORD_REGEX.test(formData.newPassword)) {
      errors.newPassword = "Password must be at least 8 characters and include at least one letter and one number";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: formData.newPassword, confirmPassword: formData.confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message?.toLowerCase().includes("invalid") || data.message?.toLowerCase().includes("expired")) {
          setError("This reset link is invalid or expired. Please request a new one.");
        } else {
          setError(data.message);
        }
      } else {
        setMessage(data.message);
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
      </Link>

      <div className="login-card">
        <div className="login-left">
          <h1>Reset Password</h1>
          <p>Enter your new password below. The link expires after 15 minutes.</p>
        </div>

        <div className="login-right">
          {message ? (
            <div>
              <p style={{ color: "green", marginBottom: "1rem" }}>{message}</p>
              <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                Redirecting to login...
              </p>
              <div className="login-links">
                <Link to="/login">Go to Login</Link>
              </div>
            </div>
          ) : (
            <form className="loginForm" onSubmit={handleSubmit} noValidate>
              {!token && (
                <p style={{ color: "red", marginBottom: "1rem" }}>
                  This reset link is invalid or expired. Please request a new one.
                </p>
              )}

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={!token}
                />
                {fieldErrors.newPassword && (
                  <p style={{ color: "red", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {fieldErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={!token}
                />
                {fieldErrors.confirmPassword && (
                  <p style={{ color: "red", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {error && <p style={{ color: "red" }}>{error}</p>}

              <button type="submit" className="login-btn" disabled={loading || !token}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="login-links">
                <Link to="/login">Back to Login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
