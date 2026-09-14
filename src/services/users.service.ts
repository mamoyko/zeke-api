import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { conflict } from "../errors";
import type { UserRow } from "../types";

const BCRYPT_ROUNDS = 10;

export function findByEmail(email: string): Promise<UserRow | null> {
  return prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
}

export function findById(id: string): Promise<UserRow | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function createLocal(
  name: string,
  email: string,
  password: string,
): Promise<UserRow> {
  const cleanEmail = email.trim().toLowerCase();
  if (await findByEmail(cleanEmail)) {
    throw conflict("An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return prisma.user.create({
    data: { name: name.trim(), email: cleanEmail, passwordHash },
  });
}

export async function verifyPassword(user: UserRow, password: string): Promise<boolean> {
  if (!user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}

/**
 * Finds or creates the user for a verified Google identity. If a local
 * account already exists with the same email, Google sign-in links onto that
 * same account (by googleId) rather than creating a duplicate — so signing
 * up with a password and later tapping "Continue with Google" with the same
 * email lands on one account, not two.
 */
export async function findOrCreateGoogleUser(
  googleId: string,
  email: string,
  name: string,
): Promise<UserRow> {
  const cleanEmail = email.trim().toLowerCase();

  const byGoogleId = await prisma.user.findUnique({ where: { googleId } });
  if (byGoogleId) return byGoogleId;

  const byEmail = await findByEmail(cleanEmail);
  if (byEmail) {
    return prisma.user.update({ where: { id: byEmail.id }, data: { googleId } });
  }

  return prisma.user.create({
    data: { name: name.trim() || cleanEmail, email: cleanEmail, googleId },
  });
}
