import jwt from "jsonwebtoken";
import { findPasswordChangedAtById } from "../models/userModel.js";

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

  // Reject tokens issued before a password change
  const user = await findPasswordChangedAtById(req.userId);
  if (user?.password_changed_at) {
    const changedAtSeconds = new Date(user.password_changed_at).getTime() / 1000;
    if (decoded.iat < changedAtSeconds) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
