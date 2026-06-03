import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/login/login.css";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
      } else {
        setMessage(data.message);
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
          <h1>Forgot Password</h1>
          <p>
            Enter the email address associated with your account and we'll send you a reset link.
          </p>
        </div>

        <div className="login-right">
          {message ? (
            <div>
              <p style={{ color: "green", marginBottom: "1.5rem" }}>{message}</p>
              <div className="login-links">
                <Link to="/login">Back to Login</Link>
              </div>
            </div>
          ) : (
            <form className="loginForm" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p style={{ color: "red" }}>{error}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPasswordPage;
