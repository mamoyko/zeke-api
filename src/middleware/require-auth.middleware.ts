import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

/** Requires `Authorization: Bearer <token>`; sets `req.userId` on success
 * (see types/.d.ts for the Express.Request augmentation). */
export default function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"] ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    return res.status(401).json({ error: "Not signed in." });
  }

  req.userId = userId;
  next();
}
