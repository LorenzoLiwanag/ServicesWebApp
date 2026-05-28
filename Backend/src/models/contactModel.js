import db from "../config/Database.js";

export const insertContactInquiry = async ({ name, email, subject, message }) => {
  const [result] = await db.execute(
    `INSERT INTO contact_inquiry (name, email, subject, message) VALUES (?, ?, ?, ?)`,
    [name, email, subject, message]
  );
  return result.insertId;
};

export const findContactInquiries = async (status) => {
  const [rows] = status
    ? await db.execute(
        `SELECT id, name, email, subject, message, status, created_at
         FROM contact_inquiry WHERE status = ? ORDER BY created_at DESC`,
        [status]
      )
    : await db.execute(
        `SELECT id, name, email, subject, message, status, created_at
         FROM contact_inquiry ORDER BY created_at DESC`
      );
  return rows;
};

export const updateContactInquiryStatus = async (id, status) => {
  const [result] = await db.execute(
    `UPDATE contact_inquiry SET status = ? WHERE id = ?`,
    [status, id]
  );
  return result.affectedRows;
};
