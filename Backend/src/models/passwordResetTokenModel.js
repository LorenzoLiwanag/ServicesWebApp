import database from "../config/Database.js";

export const createPasswordResetToken = async ({ userId, tokenHash, expiresAt }) => {
  const [result] = await database.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
  return result.insertId;
};

export const findPasswordResetToken = async (tokenHash) => {
  const [rows] = await database.execute(
    `SELECT * FROM password_reset_tokens WHERE token_hash = ? LIMIT 1`,
    [tokenHash]
  );
  return rows[0];
};

export const markPasswordResetTokenUsed = async (id) => {
  const [result] = await database.execute(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`,
    [id]
  );
  return result.affectedRows;
};
