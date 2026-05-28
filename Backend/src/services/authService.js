import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../models/userModel.js";

export const registerUserService = async (userData) => {
  const { firstName, lastName, email, phoneNumber, password } = userData;

  if (!firstName || !lastName || !email || !phoneNumber || !password) {
    throw new Error("All fields are required");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await createUser({ firstName, lastName, email, phoneNumber, passwordHash });

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
