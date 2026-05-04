import { useState } from "react";
import { Link } from "react-router-dom";
import AuthHomeButton from "../shared/AuthHomeButton.jsx";
import "../../styles/registration/registration.css";

const RegistrationForm = () => {

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    phoneNumber: "",
    address: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

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
        setMessage("Account created successfully!");
        setFormData({
          fullName: "",
          userName: "",
          phoneNumber: "",
          address: "",
          password: ""
        });
      }

    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="registration-page">
      <AuthHomeButton />

      <div className="registration-card">
        <div className="registration-left">
          <h1>Create your account</h1>
          <p>
            Join Subic Bay Home Services today to access a wide range of home
            services and manage your bookings with ease.
          </p>
        </div>

        <div className="registration-right">
          <form className="registrationForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your first and last name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="userName"
                placeholder="Choose a username"
                value={formData.userName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

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
