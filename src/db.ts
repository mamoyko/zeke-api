import { PrismaClient } from "@prisma/client";
import { config } from "./config";

/**
 * One Prisma client, shared by every service. The URL is passed explicitly
 * (rather than left to Prisma's own `process.env.DATABASE_URL` lookup) so
 * `config.ts`'s dotenv loading and defaulting are the one source of truth for
 * where the database is, the same as every other setting in this app.
 */
export const prisma = new PrismaClient({
  datasources: { db: { url: config.databaseUrl } },
});
