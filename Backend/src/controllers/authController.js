import { registerUserService } from "../services/authService.js";

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