import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  
  // Mock user data
  const [mockUser] = useState({
    userId: 1,
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan.delacruz@example.com",
    phoneNumber: "09101234567",
    userType: "both", // "client", "provider", or "both"
    profilePhoto: "https://via.placeholder.com/150",
  });

  const [mockProviderProfile] = useState({
    displayName: "Juan's Home Services",
    bio: "Professional service provider with 5+ years of experience. Specializing in plumbing and home repairs.",
    verificationStatus: "verified",
    servicesCount: 3,
    averageRating: 4.8,
    totalReviews: 24,
  });

  const [mockAddress] = useState({
    label: "Home",
    line1: "123 Main Street",
    line2: "Apartment 4B",
    barangay: "San Rafael",
    city: "Manila",
    province: "Metro Manila",
    postalCode: "1010",
  });

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    email: mockUser.email,
    phoneNumber: mockUser.phoneNumber,
  });

  const [addressData, setAddressData] = useState(mockAddress);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // TODO: Save to database
    console.log("Saving profile data:", formData);
    console.log("Saving address data:", addressData);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      email: mockUser.email,
      phoneNumber: mockUser.phoneNumber,
    });
    setAddressData(mockAddress);
    setIsEditMode(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleBackToDashboard = () => {
    navigate("/client-dashboard");
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <button className="back-btn" onClick={handleBackToDashboard}>
          ← Back
        </button>
        <h1 className="profile-title">My Profile</h1>
        <div className="header-actions">
          {!isEditMode && (
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditMode(true)}
            >
              ✏️ Edit Profile
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-photo-section">
            <img 
              src={mockUser.profilePhoto} 
              alt="Profile" 
              className="profile-photo"
            />
            <p className="user-name">{mockUser.firstName} {mockUser.lastName}</p>
            {(mockUser.userType === "provider" || mockUser.userType === "both") && (
              <span className="user-badge provider-badge">Provider</span>
            )}
            {(mockUser.userType === "client" || mockUser.userType === "both") && (
              <span className="user-badge client-badge">Client</span>
            )}
          </div>

          {mockUser.userType === "provider" || mockUser.userType === "both" ? (
            <div className="provider-stats">
              <div className="stat-item">
                <p className="stat-label">Rating</p>
                <p className="stat-value">⭐ {mockProviderProfile.averageRating}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Reviews</p>
                <p className="stat-value">{mockProviderProfile.totalReviews}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Services</p>
                <p className="stat-value">{mockProviderProfile.servicesCount}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Main Content */}
        <div className="profile-content">
          {/* Personal Information Section */}
          <section className="profile-section">
            <div className="section-header">
              <h2 className="section-title">Personal Information</h2>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>
            </div>
          </section>

          {/* Address Section */}
          <section className="profile-section">
            <div className="section-header">
              <h2 className="section-title">Address Information</h2>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="addressLabel" className="form-label">
                  Address Label
                </label>
                <input
                  type="text"
                  id="addressLabel"
                  name="label"
                  value={addressData.label}
                  onChange={handleAddressChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="line1" className="form-label">
                  Street Address
                </label>
                <input
                  type="text"
                  id="line1"
                  name="line1"
                  value={addressData.line1}
                  onChange={handleAddressChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="line2" className="form-label">
                  Apartment / Suite (Optional)
                </label>
                <input
                  type="text"
                  id="line2"
                  name="line2"
                  value={addressData.line2}
                  onChange={handleAddressChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="barangay" className="form-label">
                  Barangay
                </label>
                <input
                  type="text"
                  id="barangay"
                  name="barangay"
                  value={addressData.barangay}
                  onChange={handleAddressChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="city" className="form-label">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={addressData.city}
                  onChange={handleAddressChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="province" className="form-label">
                  Province
                </label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={addressData.province}
                  onChange={handleAddressChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="postalCode" className="form-label">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={addressData.postalCode}
                  onChange={handleAddressChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>
            </div>
          </section>

          {/* Provider Profile Section (if applicable) */}
          {mockUser.userType === "provider" || mockUser.userType === "both" ? (
            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Provider Information</h2>
              </div>

              <div className="provider-info">
                <div className="info-item">
                  <p className="info-label">Display Name</p>
                  <p className="info-value">{mockProviderProfile.displayName}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">Bio</p>
                  <p className="info-value">{mockProviderProfile.bio}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">Verification Status</p>
                  <p className="info-value">
                    <span className={`status-badge ${mockProviderProfile.verificationStatus}`}>
                      {mockProviderProfile.verificationStatus.charAt(0).toUpperCase() + mockProviderProfile.verificationStatus.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Action Buttons */}
          {isEditMode && (
            <div className="form-actions">
              <button className="btn-save" onClick={handleSave}>
                💾 Save Changes
              </button>
              <button className="btn-cancel" onClick={handleCancel}>
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
