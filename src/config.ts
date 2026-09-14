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

// Only needed to actually email someone when they receive a Word Bounty —
// see utils/mailer.ts. Without it, bounties still work exactly the same;
// the recipient just has to notice it themselves in the app.
export const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
export const MAIL_FROM = (process.env.MAIL_FROM || "Zeke Mobile <onboarding@resend.dev>") as string;

export const mailConfigured = (): boolean => !!RESEND_API_KEY;

// Only needed to send a real push notification (via Firebase Cloud
// Messaging) the instant someone receives a Word Bounty — see utils/push.ts.
// Without it, bounties still work exactly the same. Points at a Firebase
// service account JSON file, downloaded from your own Firebase project's
// console — never commit that file (see .gitignore).
export const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH as string;
