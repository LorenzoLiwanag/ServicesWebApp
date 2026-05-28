import bcrypt from "bcrypt";
import database from "./src/config/Database.js";

const ADMIN = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
  phoneNumber: "416-555-0000",
  password: "admin1234",
  role: "admin",
};

const run = async () => {
  try {
    await database.query("SELECT 1");
    console.log("Database connected.");

    const [existing] = await database.execute(
      "SELECT id FROM users WHERE email = ?",
      [ADMIN.email]
    );

    if (existing.length > 0) {
      console.log(`Admin user "${ADMIN.email}" already exists (id=${existing[0].id}). Nothing inserted.`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN.password, 10);

    const [result] = await database.execute(
      `INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ADMIN.firstName, ADMIN.lastName, ADMIN.email, ADMIN.phoneNumber, hash, ADMIN.role]
    );

    console.log(`Admin user created — id: ${result.insertId}`);
    console.log(`  Email    : ${ADMIN.email}`);
    console.log(`  Password : ${ADMIN.password}`);
    console.log(`  Role     : ${ADMIN.role}`);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await database.end();
  }
};

run();
