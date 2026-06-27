import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../models/userModel.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
const PHONE_REGEX = /^[0-9+\-\s()]+$/;

export const registerUserService = async (userData) => {
  const firstName = userData.firstName?.trim();
  const lastName = userData.lastName?.trim();
  const email = userData.email?.trim().toLowerCase();
  const phoneNumber = userData.phoneNumber?.trim();
  // Passwords are intentionally NOT trimmed — they must be stored exactly as
  // typed so login (which also does not trim) can match them.
  const password = userData.password;
  const confirmPassword = userData.confirmPassword;

  if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
    throw new Error("Make sure all fields are filled out before registering");
  }

  // Enforce the database column limits up front so an over-length value is
  // rejected with a friendly message instead of surfacing a raw DB error.
  if (firstName.length > 100 || lastName.length > 100) {
    throw new Error("First and last name must be 100 characters or fewer");
  }

  if (email.length > 255) {
    throw new Error("Email must be 255 characters or fewer");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Invalid email format");
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new Error("Password must be at least 8 characters and include at least one letter and one number");
  }

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  if (phoneNumber.length > 30 || !PHONE_REGEX.test(phoneNumber) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw new Error("Invalid phone number");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
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
  const email = userData.email?.trim().toLowerCase();
  const password = userData.password;

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

  if (user.approval_status === "pending") {
    throw new Error("Your account is being reviewed for confirmation. Please wait for admin approval before logging in.");
  }

  if (user.approval_status === "rejected") {
    throw new Error("Your registration was not approved. Please contact support for more information.");
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
