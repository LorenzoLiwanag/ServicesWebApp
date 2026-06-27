import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import providerRoutes from "./src/routes/providerRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import conversationRoutes from "./src/routes/messageRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

const app = express();

// Restrict CORS to known origins. In production, set CORS_ORIGINS (or
// FRONTEND_URL) to a comma-separated list of allowed origins. In development we
// also allow any localhost port, since Create React App picks a dynamic port.
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser / same-origin requests that send no Origin header.
    if (!origin) return callback(null, true);
    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api", contactRoutes);
app.use("/api/admin", adminRoutes);

export default app;
