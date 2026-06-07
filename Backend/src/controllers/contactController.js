import {
  insertContactInquiry,
  findContactInquiries,
  updateContactInquiryStatus,
} from "../models/contactModel.js";
import { sendEmail } from "../services/emailService.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(["new", "read", "resolved", "archived"]);

export const postContact = async (req, res) => {
  const { name, email, subject, message } = req.body ?? {};

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ message: "Name, email, subject, and message are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }
  if (message.trim().length < 10) {
    return res.status(400).json({ message: "Message must be at least 10 characters." });
  }

  try {
    const id = await insertContactInquiry({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      notifyAdmin({ id, name, email, subject, message }).catch(() => {});
    }

    return res.status(201).json({ message: "Message received. Thank you!", id });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save your message. Please try again." });
  }
};

export const getContactSubmissions = async (req, res) => {
  const { status } = req.query;
  try {
    const rows = await findContactInquiries(status && status !== "all" ? status : null);
    return res.json({ submissions: rows });
  } catch {
    return res.status(500).json({ message: "Failed to load submissions." });
  }
};

export const patchContactSubmission = async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ message: "Status must be one of: new, read, resolved, archived." });
  }

  try {
    const affected = await updateContactInquiryStatus(id, status);
    if (!affected) return res.status(404).json({ message: "Submission not found." });
    return res.json({ message: "Status updated.", id, status });
  } catch {
    return res.status(500).json({ message: "Failed to update submission." });
  }
};

async function notifyAdmin({ id, name, email, subject, message }) {
  await sendEmail({
    to: process.env.ADMIN_NOTIFICATION_EMAIL,
    subject: `New contact inquiry #${id} — ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
  });
}
