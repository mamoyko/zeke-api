import type { User } from "@prisma/client";

/** The Prisma row shape — re-exported so the rest of the app imports "the
 * user type" from `models/`, matching where every other type lives, rather
 * than reaching into `@prisma/client` directly outside the repository layer. */
export type TUser = User;

/** What other players are allowed to see — never an email. */
export interface TPlayerCard {
  id: string;
  name: string;
  username: string;
}

export interface TPublicUser {
  id: string;
  name: string;
  username: string;
  email: string;
  provider: "local" | "google";
}

export function toPlayerCard(row: { id: string; name: string; username: string }): TPlayerCard {
  return { id: row.id, name: row.name, username: row.username };
}

/** Never send back a password hash or a Google id — only this shape. */
export function toPublicUser(row: TUser): TPublicUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    provider: row.googleId ? "google" : "local",
  };
}
