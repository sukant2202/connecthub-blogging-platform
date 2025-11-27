import mongoose from "mongoose";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let isConnected = false;

export async function ensureDatabaseReady() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL!);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

// Ensure connection on import
if (process.env.NODE_ENV !== "test") {
  ensureDatabaseReady().catch((err) => {
    console.error("Database connection error:", err);
  });
}

export { mongoose as db };
