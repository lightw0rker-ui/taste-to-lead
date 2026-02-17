import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const fallbackDatabaseUrl = "postgresql://invalid:invalid@127.0.0.1:5432/invalid";
const connectionString = process.env.DATABASE_URL ?? fallbackDatabaseUrl;

if (!process.env.DATABASE_URL) {
  console.error("[DB] DATABASE_URL is not set. DB-backed routes will return 503 until it is configured.");
}

export const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
