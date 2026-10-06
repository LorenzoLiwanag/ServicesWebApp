import app from "./app.js";
import database from "./src/config/Database.js";
import { runPaymentJobs } from "./src/controllers/paymentController.js";

const PAYMENT_JOB_INTERVAL_MS = 5 * 60 * 1000;

// Expire unpaid deposits and auto-confirm finished jobs. Each step is a
// conditional UPDATE, so overlapping runs or multiple instances are safe.
const runJobsSafely = () =>
  runPaymentJobs().catch((err) => console.error("Payment jobs failed:", err));

const PORT = 3000;

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required. Set JWT_SECRET in your environment variables.");
    process.exit(1);
  }

  try {
    await database.query("SELECT 1");
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    runJobsSafely();
    setInterval(runJobsSafely, PAYMENT_JOB_INTERVAL_MS);

  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

startServer();