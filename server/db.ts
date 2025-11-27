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
  } catch (error: any) {
    console.error("Failed to connect to MongoDB:", error);
    
    if (error instanceof Error && error.message.includes("Invalid scheme")) {
      console.error(
        "\n⚠️  DATABASE_URL validation failed. Please ensure:\n" +
        "1. Your connection string starts with 'mongodb://' or 'mongodb+srv://'\n" +
        "2. You're using MongoDB Atlas or another MongoDB service\n" +
        "3. Your connection string is correctly formatted\n" +
        "See DEPLOYMENT.md for MongoDB Atlas setup instructions."
      );
    } else if (error?.code === 8000 || error?.codeName === 'AtlasError' || error?.errmsg?.includes('bad auth')) {
      console.error(
        "\n❌ MongoDB Authentication Failed!\n" +
        "This means your username or password in the DATABASE_URL is incorrect.\n\n" +
        "🔧 How to fix:\n" +
        "1. Go to MongoDB Atlas → Database Access\n" +
        "2. Verify your database user exists and is active\n" +
        "3. If needed, reset the password:\n" +
        "   - Click 'Edit' on your database user\n" +
        "   - Click 'Edit Password'\n" +
        "   - Set a new password and save it\n" +
        "4. Update your DATABASE_URL in Render:\n" +
        "   - Go to Render Dashboard → Your Service → Environment\n" +
        "   - Update DATABASE_URL with the correct username and password\n" +
        "   - Format: mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/user_blog_portal?retryWrites=true&w=majority\n" +
        "5. Make sure to URL-encode special characters in password:\n" +
        "   - @ becomes %40\n" +
        "   - : becomes %3A\n" +
        "   - / becomes %2F\n" +
        "   - ? becomes %3F\n" +
        "   - # becomes %23\n" +
        "   - [ becomes %5B\n" +
        "   - ] becomes %5D\n\n" +
        "💡 Tip: Use a simple password without special characters to avoid encoding issues."
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
