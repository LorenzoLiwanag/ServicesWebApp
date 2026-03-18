import database from "../config/Database.js";

export const createUser = async ({
  fullName,
  userName,
  phoneNumber,
  address,
  passwordHash
}) => {
  const sql = `
    INSERT INTO users (full_name, user_name, phone_number, address_text, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    fullName,
    userName,
    phoneNumber,
    address,
    passwordHash
  ];

  const [result] = await database.execute(sql, values);
  return result;
};

export const findUserByUsername = async (userName) => {
  const sql = `SELECT * FROM users WHERE user_name = ?`;
  const [rows] = await database.execute(sql, [userName]);
  return rows[0];
};