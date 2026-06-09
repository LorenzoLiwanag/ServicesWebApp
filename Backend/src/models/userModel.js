import database from "../config/Database.js";

export const createUser = async ({ firstName, lastName, email, phoneNumber, passwordHash }) => {
  const [result] = await database.execute(
    `INSERT INTO users (first_name, last_name, email, phone_number, password_hash, approval_status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [firstName, lastName, email, phoneNumber, passwordHash]
  );
  return result;
};

export const findUserByEmail = async (email) => {
  const [rows] = await database.execute(`SELECT * FROM users WHERE email = ?`, [email]);
  return rows[0];
};

export const findUserByEmailExcluding = async (email, userId) => {
  const [rows] = await database.execute(
    `SELECT * FROM users WHERE email = ? AND id <> ?`,
    [email, userId]
  );
  return rows[0];
};

export const findUserProfileById = async (userId) => {
  const sql = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number,
      u.profile_photo_url,
      u.role,
      u.is_active,
      u.created_at,
      pp.provider_id,
      pp.is_provider_active,
      pp.display_name,
      pp.bio,
      pp.profile_photo_url AS provider_photo_url,
      pp.verification_status,
      pp.average_rating,
      pp.total_reviews,
      COUNT(ps.id) AS services_count
    FROM users u
    LEFT JOIN provider_profile pp ON pp.provider_id = u.id
    LEFT JOIN provider_service ps
      ON ps.provider_id = u.id AND ps.is_deleted = FALSE
    WHERE u.id = ?
    GROUP BY
      u.id, u.first_name, u.last_name, u.email, u.phone_number,
      u.profile_photo_url, u.role, u.is_active, u.created_at,
      pp.provider_id, pp.is_provider_active, pp.display_name, pp.bio,
      pp.profile_photo_url, pp.verification_status, pp.average_rating, pp.total_reviews
  `;
  const [rows] = await database.execute(sql, [userId]);
  return rows[0];
};

export const findUserPasswordById = async (userId) => {
  const [rows] = await database.execute(
    `SELECT id, password_hash FROM users WHERE id = ?`,
    [userId]
  );
  return rows[0];
};

export const updateUserPasswordById = async (userId, passwordHash) => {
  const [result] = await database.execute(
    `UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE id = ?`,
    [passwordHash, userId]
  );
  return result;
};

// Lightweight auth-state lookup used by requireAuth to revalidate a token on
// every protected request: password rotation, approval status, and active flag.
export const findAuthStateById = async (userId) => {
  const [rows] = await database.execute(
    `SELECT password_changed_at, approval_status, is_active FROM users WHERE id = ?`,
    [userId]
  );
  return rows[0] ?? null;
};

export const findAllAdminIds = async () => {
  const [rows] = await database.execute(
    `SELECT id FROM users WHERE role = 'admin' AND approval_status = 'approved'`
  );
  return rows.map((r) => r.id);
};

export const findPendingUsers = async () => {
  const [rows] = await database.execute(
    `SELECT id, first_name, last_name, email, approval_status, created_at
     FROM users WHERE approval_status = 'pending' ORDER BY created_at ASC`
  );
  return rows;
};

export const approveUserById = async (userId, adminId) => {
  const [result] = await database.execute(
    `UPDATE users SET approval_status = 'approved', approved_at = NOW(), approved_by = ? WHERE id = ?`,
    [adminId, userId]
  );
  return result;
};

export const rejectUserById = async (userId, adminId, reason) => {
  const [result] = await database.execute(
    `UPDATE users SET approval_status = 'rejected', approved_by = ?, rejection_reason = ? WHERE id = ?`,
    [adminId, reason ?? null, userId]
  );
  return result;
};

export const updateUserProfileById = async (userId, { firstName, lastName, phoneNumber }) => {
  const [result] = await database.execute(
    `UPDATE users SET first_name = ?, last_name = ?, phone_number = ? WHERE id = ?`,
    [firstName, lastName, phoneNumber, userId]
  );
  return result;
};
