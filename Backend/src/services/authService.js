import bcrypt from "bcrypt";

export const registerUserService = async (userData) => {
  const { fullName, userName, phoneNumber, address, password } = userData;

  if (!fullName || !userName || !phoneNumber || !address || !password) {
    throw new Error("All fields are required");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed password:", hashedPassword);

  return {
    fullName,
    userName,
    phoneNumber,
    address,
    hashedPassword
  };
};