import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerUserService, loginUserService } from "../services/authService.js";
import {
  findUserByEmailExcluding,
  findUserPasswordById,
  findUserProfileById,
  updateUserPasswordById,
  updateUserProfileById,
} from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const formatUser = (user) => ({
  id: user.userId,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role ?? "client",
});

const getUserIdFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const decoded = jwt.verify(token, JWT_SECRET);
  return Number(decoded.userId);
};

export const registerUser = async (req, res) => {
  try {
    await registerUserService(req.body);
    res.status(201).json({ message: "Registration successful. Please wait for admin approval before logging in." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await loginUserService(req.body);
    const token = jwt.sign(
      { userId: user.userId, firstName: user.firstName, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.status(200).json({ message: "Login successful", user: formatUser(user), token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Missing authorization token" });

    const profile = await findUserProfileById(userId);
    if (!profile) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      user: {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phoneNumber: profile.phone_number,
        profilePhotoUrl: profile.profile_photo_url,
        role: profile.role,
        isActive: Boolean(profile.is_active),
        createdAt: profile.created_at,
      },
      providerProfile: profile.provider_id
        ? {
            providerId: profile.provider_id,
            isProviderActive: Boolean(profile.is_provider_active),
            displayName: profile.display_name,
            bio: profile.bio,
            profilePhotoUrl: profile.provider_photo_url,
            verificationStatus: profile.verification_status,
            averageRating: profile.average_rating !== null ? Number(profile.average_rating) : 0,
            totalReviews: Number(profile.total_reviews || 0),
            servicesCount: Number(profile.services_count || 0),
          }
        : null,
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Failed to load profile" });
  }
};

export const updateCurrentUserProfile = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Missing authorization token" });

    const { firstName, lastName, phoneNumber } = req.body;

    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ message: "First name, last name, and phone number are required" });
    }

    await updateUserProfileById(userId, { firstName, lastName, phoneNumber });

    const updated = await findUserProfileById(userId);

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updated.id,
        firstName: updated.first_name,
        lastName: updated.last_name,
        email: updated.email,
        phoneNumber: updated.phone_number,
        profilePhotoUrl: updated.profile_photo_url,
        role: updated.role,
      },
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const verifyCurrentUserPassword = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Missing authorization token" });

    const { currentPassword } = req.body;
    if (!currentPassword) return res.status(400).json({ message: "Current password is required" });

    const user = await findUserPasswordById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(400).json({ message: "Incorrect password" });

    res.status(200).json({ message: "Password verified" });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Failed to verify password" });
  }
};

export const getMe = async (req, res) => {
  try {
    const profile = await findUserProfileById(req.userId);
    if (!profile) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      user: {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phoneNumber: profile.phone_number,
        role: profile.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load user" });
  }
};

export const changeCurrentUserPassword = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ message: "Missing authorization token" });

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await findUserPasswordById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(400).json({ message: "Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await updateUserPasswordById(userId, newHash);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Failed to update password" });
  }
};
