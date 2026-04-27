import mysql2 from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = await mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

export default db;