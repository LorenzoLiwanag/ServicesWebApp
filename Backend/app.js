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
app.use(cors());
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
