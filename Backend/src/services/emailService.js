import nodemailer from "nodemailer";

const isDevMode = () => process.env.EMAIL_DEV_MODE === "true";

const hasSmtpConfig = () =>
  Boolean(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_APP_PASSWORD
  );

const getSenderAddress = () => {
  const name = process.env.EMAIL_FROM_NAME || "Subic Bay Home Services";
  const address = process.env.EMAIL_FROM_ADDRESS || "noreply@example.com";
  return `"${name}" <${address}>`;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (isDevMode()) {
    console.log(`\n[DEV EMAIL]`);
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    if (text) {
      const indented = text.split("\n").map((l) => `    ${l}`).join("\n");
      console.log(`  Body:\n${indented}`);
    }
    console.log(`${"─".repeat(60)}\n`);
    return;
  }

  if (!hasSmtpConfig()) {
    console.error(
      `[EMAIL ERROR] SMTP credentials not configured. Could not send email to ${to}.`
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: getSenderAddress(),
    to,
    subject,
    html,
    text,
  });
};

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3001";

export const sendSignupConfirmationEmail = async ({ to, firstName }) => {
  const text = [
    `Hi ${firstName},`,
    "",
    "Your Subic Bay Home Services account has been created successfully.",
    "",
    "Your account is currently pending admin approval. You will receive another email once your account has been approved.",
    "",
    "Thank you,",
    "Subic Bay Home Services",
  ].join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <h2 style="color:#2563eb">Subic Bay Home Services</h2>
  <p>Hi ${firstName},</p>
  <p>Your Subic Bay Home Services account has been created successfully.</p>
  <p>Your account is currently <strong>pending admin approval</strong>. You will receive another email once your account has been approved.</p>
  <p>Thank you,<br>Subic Bay Home Services</p>
</div>`.trim();

  await sendEmail({
    to,
    subject: "Your Subic Bay Home Services account was created",
    html,
    text,
  });
};

export const sendAccountApprovedEmail = async ({ to, firstName }) => {
  const loginLink = `${frontendUrl()}/login`;

  const text = [
    `Hi ${firstName},`,
    "",
    "Your Subic Bay Home Services account has been approved.",
    "",
    "You can now log in and start using the platform.",
    "",
    `Login here: ${loginLink}`,
    "",
    "Thank you,",
    "Subic Bay Home Services",
  ].join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <h2 style="color:#2563eb">Subic Bay Home Services</h2>
  <p>Hi ${firstName},</p>
  <p>Your Subic Bay Home Services account has been <strong>approved</strong>. You can now log in and start using the platform.</p>
  <p><a href="${loginLink}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">Log In</a></p>
  <p>Thank you,<br>Subic Bay Home Services</p>
</div>`.trim();

  await sendEmail({
    to,
    subject: "Your Subic Bay Home Services account has been approved",
    html,
    text,
  });
};

export const sendPasswordResetEmail = async ({ to, firstName, resetLink }) => {
  const text = [
    `Hi ${firstName},`,
    "",
    "We received a request to reset your password.",
    "",
    "Click the link below to choose a new password:",
    resetLink,
    "",
    "This link will expire in 15 minutes.",
    "",
    "If you did not request this password reset, you can safely ignore this email.",
    "",
    "Thank you,",
    "Subic Bay Home Services",
  ].join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
  <h2 style="color:#2563eb">Subic Bay Home Services</h2>
  <p>Hi ${firstName},</p>
  <p>We received a request to reset your password. Click the button below to choose a new password.</p>
  <p><a href="${resetLink}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">Reset Password</a></p>
  <p style="font-size:13px;color:#666">Or copy and paste this link into your browser:<br><a href="${resetLink}">${resetLink}</a></p>
  <p style="font-size:13px;color:#666">This link will expire in <strong>15 minutes</strong>.</p>
  <p style="font-size:13px;color:#666">If you did not request this password reset, you can safely ignore this email.</p>
  <p>Thank you,<br>Subic Bay Home Services</p>
</div>`.trim();

  await sendEmail({
    to,
    subject: "Reset your Subic Bay Home Services password",
    html,
    text,
  });
};
