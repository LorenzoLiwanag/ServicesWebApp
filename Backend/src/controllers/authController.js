import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { registerUserService, loginUserService } from "../services/authService.js";
import {
  findOtherUserByUsername,
  findUserPasswordById,
  findUserProfileById,
  updateUserPasswordById,
  updateUserProfileById,
} from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const formatUser = (user) => ({
  id: user.userId,                 // 🔥 FIX
  fullName: user.fullName,
  userName: user.userName,
  phoneNumber: user.phoneNumber,
  address: user.address
});

const getAuthenticatedUserId = (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const tokenUserId = Number(decoded.userId);
  const headerUserId = Number(req.headers["x-user-id"]);

  return tokenUserId || headerUserId || null;
};

export const registerUser = async (req, res) => {
  try {
    const user = await registerUserService(req.body);

    const token = jwt.sign(
      { userId: user.userId, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: formatUser(user),      // 🔥 FIX
      token
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await loginUserService(req.body);

    const token = jwt.sign(
      { userId: user.userId, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: "Login successful",
      user: formatUser(user),      // 🔥 FIX
      token
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

export const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const userProfile = await findUserProfileById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: userProfile.id,
        fullName: userProfile.full_name,
        userName: userProfile.user_name,
        phoneNumber: userProfile.phone_number,
        address: userProfile.address_text,
        createdAt: userProfile.created_at,
      },
      providerProfile: userProfile.provider_id
        ? {
            providerId: userProfile.provider_id,
            isProviderActive: Boolean(userProfile.is_provider_active),
            displayName: userProfile.display_name,
            bio: userProfile.bio,
            profilePhotoUrl: userProfile.profile_photo_url,
            verificationStatus: userProfile.verification_status,
            servicesCount: Number(userProfile.services_count || 0),
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
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const { fullName, userName, phoneNumber, address } = req.body;

    if (!fullName || !userName || !phoneNumber || !address) {
      return res.status(400).json({ message: "All profile fields are required" });
    }

    const existingUser = await findOtherUserByUsername(userName, userId);

    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    await updateUserProfileById(userId, {
      fullName,
      userName,
      phoneNumber,
      address,
    });

    const updatedUser = await findUserProfileById(userId);

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        userName: updatedUser.user_name,
        phoneNumber: updatedUser.phone_number,
        address: updatedUser.address_text,
        createdAt: updatedUser.created_at,
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
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    const user = await findUserPasswordById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    res.status(200).json({ message: "Password verified" });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.status(500).json({ message: "Failed to verify password" });
  }
};

export const changeCurrentUserPassword = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await findUserPasswordById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPasswordById(user.id, newPasswordHash);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.status(500).json({ message: "Failed to update password" });
  }
};
