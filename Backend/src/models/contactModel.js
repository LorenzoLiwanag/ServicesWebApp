import db from "../config/Database.js";

export const insertContactSubmission = async ({ name, email, message }) => {
  const [result] = await db.execute(
    `INSERT INTO contact_submission (name, email, message) VALUES (?, ?, ?)`,
    [name, email, message]
  );
  return result.insertId;
};

export const findContactSubmissions = async (status) => {
  const [rows] = status
    ? await db.execute(
        `SELECT id, name, email, message, status, created_at
         FROM contact_submission WHERE status = ? ORDER BY created_at DESC`,
        [status]
      )
    : await db.execute(
        `SELECT id, name, email, message, status, created_at
         FROM contact_submission ORDER BY created_at DESC`
      );
  return rows;
};

export const updateContactSubmissionStatus = async (id, status) => {
  const [result] = await db.execute(
    `UPDATE contact_submission SET status = ? WHERE id = ?`,
    [status, id]
  );
  return result.affectedRows;
};
