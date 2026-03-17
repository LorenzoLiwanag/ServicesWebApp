import { registerUserService } from "../services/authService.js";

export const registerUser = async (req, res) => {
  try {
    console.log("controller hit");

    const user = await registerUserService(req.body);

    res.status(200).json({
      message: "Registration successful",
      user: {
        fullName: user.fullName,
        userName: user.userName,
        phoneNumber: user.phoneNumber,
        address: user.address
      }
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};