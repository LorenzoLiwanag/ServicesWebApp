import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../models/userModel.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

export const registerUserService = async (userData) => {
  const { firstName, lastName, email, phoneNumber, password, confirmPassword } = userData;

  if (!firstName || !lastName || !email || !password) {
    throw new Error("First name, last name, email, and password are required");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Invalid email format");
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new Error("Password must be at least 8 characters and include at least one letter and one number");
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await createUser({ firstName, lastName, email, phoneNumber: phoneNumber || null, passwordHash });

  return {
    userId: result.insertId,
    firstName,
    lastName,
    email,
    phoneNumber,
    role: "client",
  };
};

export const loginUserService = async (userData) => {
  const { email, password } = userData;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return {
    userId: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phoneNumber: user.phone_number,
    role: user.role ?? "client",
  };
};
