import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import providerRoutes from "./src/routes/providerRoutes.js";
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);

app.use("/api/provider", providerRoutes);

export default app;