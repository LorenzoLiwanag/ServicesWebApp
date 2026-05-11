import {
  insertContactSubmission,
  findContactSubmissions,
  updateContactSubmissionStatus,
} from "../models/contactModel.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(["new", "read", "archived"]);

export const postContact = async (req, res) => {
  const { name, email, message } = req.body ?? {};

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ message: "Name, email, and message are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }
  if (message.trim().length < 10) {
    return res.status(400).json({ message: "Message must be at least 10 characters." });
  }

  try {
    const id = await insertContactSubmission({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    // Fire-and-forget admin email notification if configured
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      notifyAdmin({ id, name, email, message }).catch(() => {});
    }

    return res.status(201).json({ message: "Message received. Thank you!", id });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save your message. Please try again." });
  }
};

export const getContactSubmissions = async (req, res) => {
  const { status } = req.query;
  try {
    const rows = await findContactSubmissions(status && status !== "all" ? status : null);
    return res.json({ submissions: rows });
  } catch {
    return res.status(500).json({ message: "Failed to load submissions." });
  }
};

export const patchContactSubmission = async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ message: "Status must be one of: new, read, archived." });
  }

  try {
    const affected = await updateContactSubmissionStatus(id, status);
    if (!affected) return res.status(404).json({ message: "Submission not found." });
    return res.json({ message: "Status updated.", id, status });
  } catch {
    return res.status(500).json({ message: "Failed to update submission." });
  }
};

// Optional Nodemailer notification — only runs if nodemailer is installed and SMTP is configured
async function notifyAdmin({ id, name, email, message }) {
  const { createTransport } = await import("nodemailer");
  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transport.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_NOTIFICATION_EMAIL,
    subject: `New contact form submission #${id} from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });
}
