import app from "./app.js";
import database from "./src/config/Database.js";

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

  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

startServer();