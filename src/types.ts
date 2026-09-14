import type { User } from "@prisma/client";
import type { Request } from "express";

/** Re-exported so services/routes import "the user row type" from one place
 * rather than reaching into `@prisma/client` directly everywhere. */
export type UserRow = User;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  provider: "local" | "google";
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    provider: row.googleId ? "google" : "local",
  };
}

/** An Express request after `requireAuth` has attached the caller's user id. */
export interface AuthedRequest extends Request {
  userId: string;
}
