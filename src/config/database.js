import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

// Crea un pool de conexiones a la base de datos MySQL
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Función que comprueba la conexión con la base de datos
export async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión a MySQL exitosa");
    connection.release();
  } catch (error) {
    console.error("Error al conectar con MySQL:", error.message);
  }
}
