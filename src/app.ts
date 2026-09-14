import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { authRoutes } from "./routes/auth.routes";
import { dailyRoutes } from "./routes/daily.routes";
import { HttpError } from "./errors";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/daily", dailyRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Express 4 routes async errors here via asyncHandler (see errors.ts) rather
// than natively, so this is the one place a failure actually lands.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});
