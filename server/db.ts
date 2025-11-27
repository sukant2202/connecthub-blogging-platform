import mongoose from "mongoose";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Validate DATABASE_URL format
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl.startsWith("mongodb://") && !dbUrl.startsWith("mongodb+srv://")) {
  throw new Error(
    `Invalid DATABASE_URL format. Expected connection string to start with "mongodb://" or "mongodb+srv://", but got: ${dbUrl.substring(0, 20)}...\n` +
    "Please ensure you're using a MongoDB connection string (e.g., from MongoDB Atlas)."
  );
}

let isConnected = false;

export async function ensureDatabaseReady() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(dbUrl);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    if (error instanceof Error && error.message.includes("Invalid scheme")) {
      console.error(
        "\n⚠️  DATABASE_URL validation failed. Please ensure:\n" +
        "1. Your connection string starts with 'mongodb://' or 'mongodb+srv://'\n" +
        "2. You're using MongoDB Atlas or another MongoDB service\n" +
        "3. Your connection string is correctly formatted\n" +
        "See DEPLOYMENT.md for MongoDB Atlas setup instructions."
      );
    }
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
