import mysql from "mysql2/promise";

const database = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "Services_Web_App",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default database;