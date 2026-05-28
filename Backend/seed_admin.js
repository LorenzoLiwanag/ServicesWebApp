import bcrypt from "bcrypt";
import database from "./src/config/Database.js";

const ADMIN = {
  fullName: "Admin User",
  userName: "admin",
  phoneNumber: "0000000000",
  address: "Admin HQ",
  password: "admin1234",
  role: "admin",
};

const run = async () => {
  try {
    await database.query("SELECT 1");
    console.log("Database connected.");

    const [existing] = await database.execute(
      "SELECT id FROM users WHERE user_name = ?",
      [ADMIN.userName]
    );

    if (existing.length > 0) {
      console.log(`Admin user "${ADMIN.userName}" already exists (id=${existing[0].id}). Nothing inserted.`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN.password, 10);

    const [result] = await database.execute(
      `INSERT INTO users (full_name, user_name, phone_number, address_text, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ADMIN.fullName, ADMIN.userName, ADMIN.phoneNumber, ADMIN.address, hash, ADMIN.role]
    );

    console.log(`Admin user created — id: ${result.insertId}`);
    console.log(`  Username : ${ADMIN.userName}`);
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
