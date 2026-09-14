import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/token.service";
import type { AuthedRequest } from "../types";

/** Requires `Authorization: Bearer <token>`; attaches `req.userId` on success. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }

  (req as AuthedRequest).userId = userId;
  next();
}
