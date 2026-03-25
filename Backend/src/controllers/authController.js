import jwt from 'jsonwebtoken';
import { registerUserService, loginUserService } from "../services/authService.js";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const formatUser = (user) => ({
  id: user.userId,                 // 🔥 FIX
  fullName: user.fullName,
  userName: user.userName,
  phoneNumber: user.phoneNumber,
  address: user.address
});

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