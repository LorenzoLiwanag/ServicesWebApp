import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";
import { clearAuthSession } from "../utils/auth.js";

const emptyUser = {
  id: null,
  fullName: "",
  userName: "",
  phoneNumber: "",
  address: "",
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

const ProfilePage = () => {
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(emptyUser);
  const [profileFormData, setProfileFormData] = useState(emptyUser);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState("current");
  const [passwordError, setPasswordError] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      if (storedUser) {
        const storedProfile = {
          id: storedUser.id || null,
          fullName: storedUser.fullName || "",
          userName: storedUser.userName || "",
          phoneNumber: storedUser.phoneNumber || "",
          address: storedUser.address || "",
        };

        setProfileUser(storedProfile);
        setProfileFormData(storedProfile);
      }

      try {
        const response = await fetch("http://localhost:3000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-user-id": storedUser?.id ? String(storedUser.id) : "",
          },
        });

        const data = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile");
        }

        const loadedUser = {
          id: data.user?.id || null,
          fullName: data.user?.fullName || "",
          userName: data.user?.userName || "",
          phoneNumber: data.user?.phoneNumber || "",
          address: data.user?.address || "",
        };

        setProfileUser(loadedUser);
        setProfileFormData(loadedUser);
        localStorage.setItem("user", JSON.stringify(loadedUser));
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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileFormData((prev) => ({
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

  const openPasswordModal = () => {
    setPasswordError("");
    resetPasswordFields();
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordError("");
    resetPasswordFields();
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    try {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userId = storedUser?.id || profileUser.id;

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
      setIsEditMode(false);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password.");
    }
  };

  const handleCancel = () => {
    closePasswordModal();
    setProfileFormData(profileUser);
    setProfileError("");
    setIsEditMode(false);
  };

  const handleSaveProfile = async () => {
    setProfileError("");

    if (
      !profileFormData.fullName ||
      !profileFormData.userName ||
      !profileFormData.phoneNumber ||
      !profileFormData.address
    ) {
      setProfileError("All profile fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const userId = storedUser?.id || profileUser.id;

      const response = await fetch("http://localhost:3000/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": userId ? String(userId) : "",
        },
        body: JSON.stringify({
          fullName: profileFormData.fullName,
          userName: profileFormData.userName,
          phoneNumber: profileFormData.phoneNumber,
          address: profileFormData.address,
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      const updatedUser = {
        id: data.user?.id || null,
        fullName: data.user?.fullName || "",
        userName: data.user?.userName || "",
        phoneNumber: data.user?.phoneNumber || "",
        address: data.user?.address || "",
      };

      setProfileUser(updatedUser);
      setProfileFormData(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditMode(false);
      window.alert("Profile updated successfully");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
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
            Back
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
            Back
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
      <div className="profile-header">
        <button className="back-btn" onClick={handleBackToDashboard}>
          Back
        </button>
        <h1 className="profile-title">My Profile</h1>
        <div className="header-actions">
          {!isEditMode && (
            <button
              className="edit-profile-btn"
              onClick={() => setIsEditMode(true)}
            >
              Edit Profile
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-photo-section">
            <p className="user-name">{profileUser.fullName}</p>
            <span className="user-badge client-badge">User</span>
          </div>
        </div>

        <div className="profile-content">
          <section className="profile-section">
            <div className="section-header">
              <h2 className="section-title">Account Information</h2>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={profileFormData.fullName}
                  onChange={handleProfileChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="userName" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={profileFormData.userName}
                  onChange={handleProfileChange}
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
                  value={profileFormData.phoneNumber}
                  onChange={handleProfileChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <button
                  type="button"
                  className="change-password-btn"
                  onClick={openPasswordModal}
                  disabled={!isEditMode}
                >
                  Change Password
                </button>
              </div>

              <div className="form-group full-width">
                <label htmlFor="address" className="form-label">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={profileFormData.address}
                  onChange={handleProfileChange}
                  disabled={!isEditMode}
                  className="form-input"
                />
              </div>
            </div>
            {profileError && <p style={{ color: "red" }}>{profileError}</p>}
          </section>

          {isEditMode && (
            <div className="form-actions">
              <button className="btn-save" onClick={handleSaveProfile}>
                Save Changes
              </button>
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
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
                x
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
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closePasswordModal}
                >
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
