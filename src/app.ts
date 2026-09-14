// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { isDev } from "./config";
import { connectToPrisma } from "./utils/prisma";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.json());

// Rate limiting — skipped in dev so it never gets in the way while testing.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
if (!isDev) app.use(limiter);

app.use(helmet());
app.disable("x-powered-by");

app.use(router);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Postgres via Prisma. Doesn't block startup — if this fails, requests that
// touch the database will error individually (and log), rather than the
// whole process refusing to boot.
connectToPrisma().catch((err) => {
  console.error("[app] Could not connect to Postgres:", err);
});

export default app;
