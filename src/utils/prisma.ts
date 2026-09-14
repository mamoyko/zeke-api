import "../config"; // ensures dotenv has loaded DATABASE_URL before the client reads it
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "../config";

export const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

export const connectToPrisma = async () => {
  await prisma.$connect();
};
