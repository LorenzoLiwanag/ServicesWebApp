import express from 'express';
import {
  changeCurrentUserPassword,
  getCurrentUserProfile,
  registerUser,
  loginUser,
  verifyCurrentUserPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getCurrentUserProfile);
router.post("/password/verify", verifyCurrentUserPassword);
router.patch("/password", changeCurrentUserPassword);

export default router;
