import bcrypt from "bcrypt";
import { createUser, findUserByUsername } from "../models/userModel.js";

export const registerUserService = async (userData) => {
  const { fullName, userName, phoneNumber, address, password } = userData;

  if (!fullName || !userName || !phoneNumber || !address || !password) {
    throw new Error("All fields are required");
  }

   const existingUser = await findUserByUsername(userName);

  if (existingUser) {
    throw new Error("Username already taken");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await createUser({
    fullName,
    userName,
    phoneNumber,
    address,
    passwordHash
  });

  return {
    userId: result.insertId,
    fullName,
    userName,
    phoneNumber,
    address
  };
};

export const loginUserService = async (userData) => {
  const { userName, password } = userData;

  if (!userName || !password) {
    throw new Error("Username and password are required");
  }

  const user = await findUserByUsername(userName);

  if (!user) {
    throw new Error("Invalid username or password");
  }


  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new Error("Invalid username or password");
  }


  return {
    userId: user.id,
    fullName: user.full_name,
    userName: user.user_name,
    phoneNumber: user.phone_number,
    address: user.address_text,
    role: user.role ?? "client",
  };
};
