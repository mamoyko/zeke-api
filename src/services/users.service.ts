import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { conflict } from "../errors";
import type { UserRow } from "../types";

const BCRYPT_ROUNDS = 10;

export function findByEmail(email: string): UserRow | undefined {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;
}

export function findById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export async function createLocal(
  name: string,
  email: string,
  password: string,
): Promise<UserRow> {
  const cleanEmail = email.trim().toLowerCase();
  if (findByEmail(cleanEmail)) {
    throw conflict("An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const row: UserRow = {
    id: randomUUID(),
    name: name.trim(),
    email: cleanEmail,
    password_hash: passwordHash,
    google_id: null,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, google_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(row.id, row.name, row.email, row.password_hash, row.google_id, row.created_at);

  return row;
}

export async function verifyPassword(user: UserRow, password: string): Promise<boolean> {
  if (!user.password_hash) return false;
  return bcrypt.compare(password, user.password_hash);
}

/**
 * Finds or creates the user for a verified Google identity. If a local
 * account already exists with the same email, Google sign-in links onto that
 * same account (by google_id) rather than creating a duplicate — so signing
 * up with a password and later tapping "Continue with Google" with the same
 * email lands on one account, not two.
 */
export function findOrCreateGoogleUser(googleId: string, email: string, name: string): UserRow {
  const cleanEmail = email.trim().toLowerCase();

  const byGoogleId = db
    .prepare("SELECT * FROM users WHERE google_id = ?")
    .get(googleId) as UserRow | undefined;
  if (byGoogleId) return byGoogleId;

  const byEmail = findByEmail(cleanEmail);
  if (byEmail) {
    db.prepare("UPDATE users SET google_id = ? WHERE id = ?").run(googleId, byEmail.id);
    return { ...byEmail, google_id: googleId };
  }

  const row: UserRow = {
    id: randomUUID(),
    name: name.trim() || cleanEmail,
    email: cleanEmail,
    password_hash: null,
    google_id: googleId,
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, google_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(row.id, row.name, row.email, row.password_hash, row.google_id, row.created_at);

  return row;
}
