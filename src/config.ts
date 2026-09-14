import "dotenv/config";

/**
 * All environment configuration in one typed place. Falls back to
 * zero-config dev defaults so `npm run dev` works right after `npm install`
 * with no `.env` file at all — Google Sign-In is the one thing that needs
 * real values (see auth/README.md at the project root).
 */
export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "zeke-mobile-dev-secret-change-me",
  databasePath: process.env.DATABASE_PATH ?? "./data/zeke.db",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
};

export const googleConfigured = (): boolean =>
  config.google.clientId !== "" && config.google.clientSecret !== "";
