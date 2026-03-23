import jwt from 'jsonwebtoken';
import { registerUserService, loginUserService } from "../services/authService.js";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const registerUser = async (req, res) => {
  try {
    const user = await registerUserService(req.body);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: "User registered successfully",
      user,
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: "Login successful",
      user,
      token
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};