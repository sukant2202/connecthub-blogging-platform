import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const setupPromise = pool
  .query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
  .catch((error) => {
    console.warn('Warning: failed to ensure pgcrypto extension', error);
  });

export async function ensureDatabaseReady() {
  await setupPromise;
}

export const db = drizzle({ client: pool, schema });
