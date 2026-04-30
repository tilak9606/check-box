import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {User} from "../../modules/auth/auth.models.js";

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new pg.Pool({ connectionString })
  : new pg.Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
      database: process.env.PGDATABASE || "SeatBooking",
      max: 20,
      connectionTimeoutMillis: 0,
      idleTimeoutMillis: 0,
    });

const db = drizzle(pool, { schema: { User } });

const connectDB = async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error(`PostgreSQL connection error: ${error.message}`);
    process.exit(1);
  }
};

export { db, pool, connectDB };
export default db;
