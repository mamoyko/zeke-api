import * as dotenv from "dotenv";
dotenv.config();

export const PORT = Number(process.env.PORT || 4000);
export const isDev = process.env.NODE_ENV !== "production";

export const JWT_SECRET = (process.env.JWT_SECRET ||
  "zeke-mobile-dev-secret-change-me") as string;

export const DATABASE_URL = (process.env.DATABASE_URL ||
  "postgresql://zeke:zeke@localhost:5433/zeke?schema=public") as string;

// Only needed for the "Continue with Google" button — see
// ../zeke-mobile/auth/README.md. The Godot client only ever sees
// GOOGLE_CLIENT_ID (client IDs are meant to be public); GOOGLE_CLIENT_SECRET
// stays here on the server and is never shipped inside the game.
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;

export const googleConfigured = (): boolean => !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET;
