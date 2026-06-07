import express from "express";
import rateLimit from "express-rate-limit";
import {
  changeCurrentUserPassword,
  getCurrentUserProfile,
  getMe,
  registerUser,
  loginUser,
  updateCurrentUserProfile,
  verifyCurrentUserPassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const makeLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

const loginLimiter = makeLimiter(15 * 60 * 1000, 5, "Too many login attempts. Please try again later.");
const registerLimiter = makeLimiter(60 * 60 * 1000, 10, "Too many registration attempts. Please try again later.");
const forgotPasswordLimiter = makeLimiter(15 * 60 * 1000, 5, "Too many password reset requests. Please try again later.");
const resetPasswordLimiter = makeLimiter(15 * 60 * 1000, 5, "Too many password reset attempts. Please try again later.");

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.get("/me", requireAuth, getMe);
router.get("/profile", requireAuth, getCurrentUserProfile);
router.patch("/profile", requireAuth, updateCurrentUserProfile);
router.post("/password/verify", requireAuth, verifyCurrentUserPassword);
router.patch("/password", requireAuth, changeCurrentUserPassword);

export default router;
