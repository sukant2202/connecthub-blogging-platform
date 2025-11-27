import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
    };
  }
}

