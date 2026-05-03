import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

const emptyUser = {
  userId: null,
  firstName: "",
  lastName: "",
  phoneNumber: "",
  userType: "client",
  profilePhoto: "https://via.placeholder.com/150",
};

const emptyProviderProfile = {
  displayName: "",
  bio: "",
  verificationStatus: "pending",
  servicesCount: 0,
  averageRating: 0,
  totalReviews: 0,
};

const emptyAddress = {
  label: "Home",
  line1: "",
  line2: "",
  barangay: "",
  city: "",
  province: "",
  postalCode: "",
};

const splitFullName = (fullName = "") => {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" "),
  };
};

const parseJsonResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "Profile service returned an unexpected response. Please restart the backend server and try again."
    );
  }
};

const parsePasswordResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: "Incorrect password" };
  }
};

const mapProfileData = (profileUser, providerProfile) => {
  const { firstName, lastName } = splitFullName(profileUser?.fullName);

  return {
    user: {
      userId: profileUser?.id || null,
      firstName,
      lastName,
      phoneNumber: profileUser?.phoneNumber || "",
      userType: providerProfile ? "both" : "client",
      profilePhoto:
        providerProfile?.profilePhotoUrl || "https://via.placeholder.com/150",
    },
    providerProfile: providerProfile
      ? {
          displayName: providerProfile.displayName || "",
          bio: providerProfile.bio || "",
          verificationStatus: providerProfile.verificationStatus || "pending",
          servicesCount: providerProfile.servicesCount || 0,
          averageRating: providerProfile.averageRating || 0,
          totalReviews: providerProfile.totalReviews || 0,
        }
      : emptyProviderProfile,
    address: {
      ...emptyAddress,
      line1: profileUser?.address || "",
    },
  };
};

const ProfilePage = () => {
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(emptyUser);
  const [providerProfile, setProviderProfile] = useState(emptyProviderProfile);
  const [profileAddress, setProfileAddress] = useState(emptyAddress);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState("current");

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: emptyUser.firstName,
    lastName: emptyUser.lastName,
    phoneNumber: emptyUser.phoneNumber,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [addressData, setAddressData] = useState(emptyAddress);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      if (storedUser) {
        const mappedStoredData = mapProfileData(storedUser, null);
        setProfileUser(mappedStoredData.user);
        setProfileAddress(mappedStoredData.address);
        setFormData({
          firstName: mappedStoredData.user.firstName,
          lastName: mappedStoredData.user.lastName,
          phoneNumber: mappedStoredData.user.phoneNumber,
        });
        setAddressData(mappedStoredData.address);
      }

      try {
        const response = await fetch("http://localhost:3000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile");
        }

        const mappedProfileData = mapProfileData(
          data.user,
          data.providerProfile
        );

        setProfileUser(mappedProfileData.user);
        setProviderProfile(mappedProfileData.providerProfile);
        setProfileAddress(mappedProfileData.address);
        setFormData({
          firstName: mappedProfileData.user.firstName,
          lastName: mappedProfileData.user.lastName,
          phoneNumber: mappedProfileData.user.phoneNumber,
        });
        setAddressData(mappedProfileData.address);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (err) {
        if (!storedUser) {
          setError(err.message || "Failed to load profile");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetPasswordFields = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordStep("current");
  };

  const handleSave = () => {
    setIsEditMode(false);
  };

  const openPasswordModal = () => {
    setPasswordMessage("");
    setPasswordError("");
    resetPasswordFields();
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    resetPasswordFields();
    setPasswordError("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    try {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userId = storedUser?.id || profileUser.userId;

      if (passwordStep === "current") {
        if (!passwordData.currentPassword) {
          setPasswordError("Enter your current password.");
          return;
        }

        const response = await fetch(
          "http://localhost:3000/api/auth/password/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-user-id": userId ? String(userId) : "",
            },
            body: JSON.stringify({
              currentPassword: passwordData.currentPassword,
            }),
          }
        );

        const data = await parsePasswordResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Incorrect password");
        }

        setPasswordStep("new");
        return;
      }

      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError("Enter and confirm your new password.");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("New passwords do not match.");
        return;
      }

      const response = await fetch("http://localhost:3000/api/auth/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": userId ? String(userId) : "",
        },
        body: JSON.stringify(passwordData),
      });

      const data = await parsePasswordResponse(response);

      if (!response.ok) {
        const message =
          data.message === "Current password is incorrect"
            ? "Incorrect password"
            : data.message || "Failed to update password";

        throw new Error(message);
      }

      resetPasswordFields();
      window.alert("Password updated successfully");
      setIsPasswordModalOpen(false);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password.");
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profileUser.firstName,
      lastName: profileUser.lastName,
      phoneNumber: profileUser.phoneNumber,
    });
    setAddressData(profileAddress);
    resetPasswordFields();
    setPasswordMessage("");
    setPasswordError("");
    setIsPasswordModalOpen(false);
    setIsEditMode(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleBackToDashboard = () => {
    navigate("/client-dashboard");
  };

  const handleForgotPassword = () => {
    setPasswordError("Forgot password reset is not available yet.");
  };

  const handlePasswordTryAgain = () => {
    resetPasswordFields();
    setPasswordError("");
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button className="back-btn" onClick={handleBackToDashboard}>
            ← Back
          </button>
          <h1 className="profile-title">My Profile</h1>
        </div>
        <div className="profile-container">
          <div className="profile-content">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button className="back-btn" onClick={handleBackToDashboard}>
            ← Back
          </button>
          <h1 className="profile-title">My Profile</h1>
        </div>
        <div className="profile-container">
          <div className="profile-content">{error}</div>
        </div>
      </div>
    );
  }

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
              src={profileUser.profilePhoto}
              alt="Profile"
              className="profile-photo"
            />
            <p className="user-name">
              {profileUser.firstName} {profileUser.lastName}
            </p>
            {(profileUser.userType === "provider" ||
              profileUser.userType === "both") && (
              <span className="user-badge provider-badge">Provider</span>
            )}
            {(profileUser.userType === "client" ||
              profileUser.userType === "both") && (
              <span className="user-badge client-badge">Client</span>
            )}
          </div>

          {profileUser.userType === "provider" ||
          profileUser.userType === "both" ? (
            <div className="provider-stats">
              <div className="stat-item">
                <p className="stat-label">Rating</p>
                <p className="stat-value">⭐ {providerProfile.averageRating}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Reviews</p>
                <p className="stat-value">{providerProfile.totalReviews}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Services</p>
                <p className="stat-value">{providerProfile.servicesCount}</p>
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
                <label className="form-label">
                  Password
                </label>
                <button
                  type="button"
                  className="change-password-btn"
                  onClick={openPasswordModal}
                  disabled={!isEditMode}
                >
                  Change Password
                </button>
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
            {passwordMessage && <p style={{ color: "green" }}>{passwordMessage}</p>}
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
          {profileUser.userType === "provider" ||
          profileUser.userType === "both" ? (
            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Provider Information</h2>
              </div>

              <div className="provider-info">
                <div className="info-item">
                  <p className="info-label">Display Name</p>
                  <p className="info-value">{providerProfile.displayName}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">Bio</p>
                  <p className="info-value">{providerProfile.bio}</p>
                </div>

                <div className="info-item">
                  <p className="info-label">Verification Status</p>
                  <p className="info-value">
                    <span
                      className={`status-badge ${providerProfile.verificationStatus}`}
                    >
                      {providerProfile.verificationStatus.charAt(0).toUpperCase() +
                        providerProfile.verificationStatus.slice(1)}
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

      {isPasswordModalOpen && (
        <div className="password-modal-backdrop" role="presentation">
          <div className="password-modal" role="dialog" aria-modal="true">
            <div className="password-modal-header">
              <h2 className="password-modal-title">Change Password</h2>
              <button
                type="button"
                className="password-modal-close"
                onClick={closePasswordModal}
                aria-label="Close password prompt"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  autoComplete="current-password"
                  disabled={passwordStep === "new"}
                />
              </div>

              {passwordStep === "new" && (
                <>
                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}

              {passwordError && (
                <div className="password-modal-error">
                  <p>{passwordError}</p>
                  {passwordError === "Incorrect password" && (
                    <div className="password-modal-error-actions">
                      <button type="button" onClick={handlePasswordTryAgain}>
                        Try Again
                      </button>
                      <button type="button" onClick={handleForgotPassword}>
                        Forgot Password
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="password-modal-actions">
                <button type="button" className="btn-cancel" onClick={closePasswordModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {passwordStep === "current" ? "Continue" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
