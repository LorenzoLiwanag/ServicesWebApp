import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV !== "production";

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const sendEmail = async ({ to, subject, text }) => {
  if (!hasSmtpConfig()) {
    if (isDev) {
      console.log(
        `[DEV EMAIL FALLBACK]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n${"─".repeat(60)}`
      );
    } else {
      console.error(`[EMAIL ERROR] SMTP credentials not configured. Could not send email to ${to}.`);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "Subic Bay Home Services <no-reply@example.com>",
    to,
    subject,
    text,
  });
};

export const sendSignupConfirmationEmail = async ({ to, firstName }) => {
  await sendEmail({
    to,
    subject: "Your Subic Bay Home Services account was created",
    text: [
      `Hi ${firstName},`,
      "",
      "Your Subic Bay Home Services account has been created successfully.",
      "",
      "Your account is currently pending admin approval. You will receive another email once your account has been approved.",
      "",
      "Thank you,",
      "Subic Bay Home Services",
    ].join("\n"),
  });
};

export const sendAccountApprovedEmail = async ({ to, firstName }) => {
  const loginLink = `${process.env.FRONTEND_URL || "http://localhost:3001"}/login`;
  await sendEmail({
    to,
    subject: "Your Subic Bay Home Services account has been approved",
    text: [
      `Hi ${firstName},`,
      "",
      "Your Subic Bay Home Services account has been approved.",
      "",
      "You can now log in and start using the platform.",
      "",
      "Login here:",
      loginLink,
      "",
      "Thank you,",
      "Subic Bay Home Services",
    ].join("\n"),
  });
};

export const sendPasswordResetEmail = async ({ to, firstName, resetLink }) => {
  await sendEmail({
    to,
    subject: "Reset your Subic Bay Home Services password",
    text: [
      `Hi ${firstName},`,
      "",
      "We received a request to reset your password.",
      "",
      "Click the link below to choose a new password:",
      resetLink,
      "",
      "This link will expire in 15 minutes.",
      "",
      "If you did not request this password reset, you can ignore this email.",
      "",
      "Thank you,",
      "Subic Bay Home Services",
    ].join("\n"),
  });
};
