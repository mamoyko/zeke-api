import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

const EXPIRES_IN = "30d"; // A mobile-style "stay signed in" session, not a web one.

export const signToken = (userId: string): string =>
  jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: EXPIRES_IN });

/** Returns the user id the token was issued for, or null if invalid/expired. */
export const verifyToken = (token: string): string | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "object" && typeof payload.sub === "string") {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
};
