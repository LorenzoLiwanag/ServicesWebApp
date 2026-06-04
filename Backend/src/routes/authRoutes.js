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

const makeLimiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

const registerLimiter = makeLimiter(5, "Too many registration attempts. Please try again later.");
const loginLimiter = makeLimiter(10, "Too many login attempts. Please try again later.");
const forgotPasswordLimiter = makeLimiter(5, "Too many password reset requests. Please try again later.");
const resetPasswordLimiter = makeLimiter(5, "Too many password reset attempts. Please try again later.");

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.get("/me", requireAuth, getMe);
router.get("/profile", getCurrentUserProfile);
router.patch("/profile", updateCurrentUserProfile);
router.post("/password/verify", verifyCurrentUserPassword);
router.patch("/password", changeCurrentUserPassword);

export default router;
