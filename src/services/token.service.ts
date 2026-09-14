import jwt from "jsonwebtoken";
import { config } from "../config";

const EXPIRES_IN = "30d"; // A mobile-style "stay signed in" session, not a web one.

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: EXPIRES_IN });
}

/** Returns the user id the token was issued for, or null if invalid/expired. */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "object" && typeof payload.sub === "string") {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
}
