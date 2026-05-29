import express from 'express';
import {
  changeCurrentUserPassword,
  getCurrentUserProfile,
  getMe,
  registerUser,
  loginUser,
  updateCurrentUserProfile,
  verifyCurrentUserPassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", requireAuth, getMe);
router.get("/profile", getCurrentUserProfile);
router.patch("/profile", updateCurrentUserProfile);
router.post("/password/verify", verifyCurrentUserPassword);
router.patch("/password", changeCurrentUserPassword);

export default router;
