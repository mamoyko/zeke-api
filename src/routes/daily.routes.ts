import { Router } from "express";
import { z } from "zod";
import { asyncHandler, badRequest } from "../errors";
import { requireAuth } from "../middleware/auth";
import { complete, getStatus, today } from "../services/daily.service";
import type { AuthedRequest } from "../types";

export const dailyRoutes = Router();
dailyRoutes.use(requireAuth);

dailyRoutes.get(
  "/today",
  asyncHandler(async (req, res) => {
    res.json(today());
  }),
);

dailyRoutes.get(
  "/status",
  asyncHandler(async (req, res) => {
    res.json(await getStatus((req as AuthedRequest).userId));
  }),
);

const completeSchema = z.object({
  won: z.boolean(),
  mistakes: z.number().int().min(0),
});

dailyRoutes.post(
  "/complete",
  asyncHandler(async (req, res) => {
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("Missing or invalid result.");

    const { won, mistakes } = parsed.data;
    res.json(await complete((req as AuthedRequest).userId, won, mistakes));
  }),
);
