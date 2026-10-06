import mysql from "mysql2/promise";
import { loadEnv } from "./loadEnv.js";

loadEnv();

const database = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "Services_Web_App",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  // Manila time everywhere, so NOW() and the 24h payment rules match the
  // service dates people pick. DATEs come back as plain "YYYY-MM-DD".
  timezone: "+08:00",
  dateStrings: ["DATE"],
});

database.on("connection", (connection) => {
  connection.query("SET time_zone = '+08:00'");
});

export default database;

export const withTransaction = async (work) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
