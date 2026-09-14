import type { Request } from "express";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  created_at: string;
}

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
    provider: row.google_id ? "google" : "local",
  };
}

/** An Express request after `requireAuth` has attached the caller's user id. */
export interface AuthedRequest extends Request {
  userId: string;
}
