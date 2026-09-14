import type { User } from "@prisma/client";

/** The Prisma row shape — re-exported so the rest of the app imports "the
 * user type" from `models/`, matching where every other type lives, rather
 * than reaching into `@prisma/client` directly outside the repository layer. */
export type TUser = User;

export interface TPublicUser {
  id: string;
  name: string;
  email: string;
  provider: "local" | "google";
}

/** Never send back a password hash or a Google id — only this shape. */
export function toPublicUser(row: TUser): TPublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    provider: row.googleId ? "google" : "local",
  };
}
