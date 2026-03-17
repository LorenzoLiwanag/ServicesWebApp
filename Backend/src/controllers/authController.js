import { registerUserService, loginUserService } from "../services/authService.js";

export const registerUser = async (req, res) => {
  try {
    const user = await registerUserService(req.body);

    res.status(201).json({
      message: "User registered successfully",
      user
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

    res.status(200).json({
      message: "Login successful",
      user
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};