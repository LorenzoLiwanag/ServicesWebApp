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

export const findUserProfileById = async (userId) => {
  const sql = `
    SELECT
      u.id,
      u.full_name,
      u.user_name,
      u.phone_number,
      u.address_text,
      u.created_at,
      pp.provider_id,
      pp.is_provider_active,
      pp.display_name,
      pp.bio,
      pp.profile_photo_url,
      pp.verification_status,
      COUNT(ps.provider_service_id) AS services_count
    FROM users u
    LEFT JOIN provider_profile pp
      ON pp.provider_id = u.id
    LEFT JOIN provider_service ps
      ON ps.provider_id = pp.provider_id
    WHERE u.id = ?
    GROUP BY
      u.id,
      u.full_name,
      u.user_name,
      u.phone_number,
      u.address_text,
      u.created_at,
      pp.provider_id,
      pp.is_provider_active,
      pp.display_name,
      pp.bio,
      pp.profile_photo_url,
      pp.verification_status
  `;

  const [rows] = await database.execute(sql, [userId]);
  return rows[0];
};

export const findUserPasswordById = async (userId) => {
  const sql = `
    SELECT id, password_hash
    FROM users
    WHERE id = ?
  `;

  const [rows] = await database.execute(sql, [userId]);
  return rows[0];
};

export const updateUserPasswordById = async (userId, passwordHash) => {
  const sql = `
    UPDATE users
    SET password_hash = ?
    WHERE id = ?
  `;

  const [result] = await database.execute(sql, [passwordHash, userId]);
  return result;
};
