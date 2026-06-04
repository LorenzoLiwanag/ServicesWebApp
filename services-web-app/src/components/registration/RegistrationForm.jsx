import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/registration/registration.css";

const RegistrationForm = () => {
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      form: "",
      [e.target.name]: ""
    }));
  };

  const validateForm = () => {
    const errors = {};
    const trimmedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value.trim()])
    );
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = trimmedData.phoneNumber.replace(/\D/g, "");
    const phoneRegex = /^[0-9+\-\s()]+$/;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

    if (Object.values(trimmedData).some((value) => !value)) {
      errors.form = "Make sure all fields are filled out before registering";
    }

    if (!trimmedData.firstName) {
      errors.firstName = "First name is required";
    }

    if (!trimmedData.lastName) {
      errors.lastName = "Last name is required";
    }

    if (trimmedData.email && !emailRegex.test(trimmedData.email)) {
      errors.email = "Invalid email format";
    } else if (!trimmedData.email) {
      errors.email = "Email is required";
    }

    if (
      trimmedData.phoneNumber &&
      (!phoneRegex.test(trimmedData.phoneNumber) || phoneDigits.length < 7 || phoneDigits.length > 15)
    ) {
      errors.phoneNumber = "Invalid phone number";
    } else if (!trimmedData.phoneNumber) {
      errors.phoneNumber = "Phone number is required";
    }

    if (trimmedData.password && !passwordRegex.test(trimmedData.password)) {
      errors.password = "Password must be at least 8 characters and include at least one letter and one number";
    } else if (!trimmedData.password) {
      errors.password = "Password is required";
    }

    if (
      trimmedData.password &&
      trimmedData.confirmPassword &&
      trimmedData.password !== trimmedData.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    } else if (!trimmedData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setFieldErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
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
        setMessage(
          "Your account has been created and is pending admin approval. Please check your email for confirmation. You will be notified once your account is approved."
        );
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          password: "",
          confirmPassword: ""
        });
        setTimeout(() => navigate("/login"), 2500);
      }

    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
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

      <div className="registration-card">
        <div className="registration-left">
          <h1>Create your account</h1>
          <p>
            Join Subic Bay Home Services today to access a wide range of home
            services and manage your bookings with ease.
          </p>
        </div>

        <div className="registration-right">
          <form className="registrationForm" onSubmit={handleSubmit} noValidate>
            {fieldErrors.form && <p className="field-error">{fieldErrors.form}</p>}

            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
              />
              {fieldErrors.firstName && <p className="field-error">{fieldErrors.firstName}</p>}
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
              />
              {fieldErrors.lastName && <p className="field-error">{fieldErrors.lastName}</p>}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {fieldErrors.phoneNumber && <p className="field-error">{fieldErrors.phoneNumber}</p>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}
            </div>

            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
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
