import session from "express-session";
import MongoStore from "connect-mongo";
import type { Express, RequestHandler } from "express";

export function setupAuth(app: Express) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET must be set");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  app.set("trust proxy", 1);
  app.use(
    session({
      secret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URL,
        collectionName: "sessions",
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
