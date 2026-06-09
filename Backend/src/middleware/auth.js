import jwt from "jsonwebtoken";
import { findAuthStateById } from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required. Set JWT_SECRET in your environment variables.");
}

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.userId = Number(decoded.userId);
  req.userRole = decoded.role ?? "client";

  // Revalidate the account on every request — a pre-issued token must not keep
  // working after the user is deleted, rejected, deactivated, or rotates their
  // password.
  const user = await findAuthStateById(req.userId);
  if (!user) {
    return res.status(401).json({ message: "Account no longer exists. Please log in again." });
  }

  // Reject tokens issued before a password change.
  if (user.password_changed_at) {
    const changedAtSeconds = new Date(user.password_changed_at).getTime() / 1000;
    if (decoded.iat < changedAtSeconds) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
  }

  // Reject users who are no longer approved (rejected after token issuance).
  // Admins are provisioned directly and are not part of the approval workflow.
  if (req.userRole !== "admin" && user.approval_status !== "approved") {
    return res.status(403).json({ message: "Your account is not approved to access this resource." });
  }

  // Reject deactivated accounts.
  if (user.is_active === 0) {
    return res.status(403).json({ message: "Your account has been deactivated." });
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
