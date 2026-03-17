import bcrypt from "bcrypt";
import { createUser } from "../models/userModel.js";

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