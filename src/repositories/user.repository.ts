import { randomBytes } from "crypto";
import { prisma } from "../utils/prisma";
import { slugFromName, USERNAME_MAX, normalizeUsername } from "../utils/username";
import type { TUser } from "../models/user.model";

export default class UserRepo {
  static findByEmail(email: string): Promise<TUser | null> {
    return prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  }

  static findById(id: string): Promise<TUser | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  static findByGoogleId(googleId: string): Promise<TUser | null> {
    return prisma.user.findUnique({ where: { googleId } });
  }

  static findByUsername(username: string): Promise<TUser | null> {
    return prisma.user.findUnique({ where: { username: normalizeUsername(username) } });
  }

  /** Username first (exact), then email if the query looks like one, then a
   * short prefix search on the handle. Never returns the caller. */
  static search(query: string, exceptUserId: string, take = 8) {
    const q = query.trim();
    if (q.includes("@")) {
      return prisma.user.findMany({
        where: { email: q.toLowerCase(), id: { not: exceptUserId } },
        take: 1,
        select: { id: true, name: true, username: true },
      });
    }

    const handle = normalizeUsername(q);
    if (handle.length < 2) return Promise.resolve([]);

    return prisma.user.findMany({
      where: {
        id: { not: exceptUserId },
        OR: [
          { username: { startsWith: handle } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      take,
      orderBy: { username: "asc" },
      select: { id: true, name: true, username: true },
    });
  }

  static async allocateUsername(name: string): Promise<string> {
    const base = slugFromName(name).slice(0, 16);
    if (!(await prisma.user.findUnique({ where: { username: base } }))) {
      return base;
    }
    for (let n = 2; n < 500; n++) {
      const suffix = String(n);
      const candidate = `${base.slice(0, USERNAME_MAX - suffix.length)}${suffix}`;
      if (!(await prisma.user.findUnique({ where: { username: candidate } }))) {
        return candidate;
      }
    }
    return `${base.slice(0, 12)}${randomBytes(2).toString("hex")}`;
  }

  /** `username`, when given, is used as-is (the caller has checked it's
   * valid and free); otherwise one is allocated from the name. */
  static async createLocal(
    name: string,
    email: string,
    passwordHash: string,
    username?: string,
  ): Promise<TUser> {
    username = username ? normalizeUsername(username) : await this.allocateUsername(name);
    return prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), passwordHash, username },
    });
  }

  static async createGoogle(name: string, email: string, googleId: string): Promise<TUser> {
    const username = await this.allocateUsername(name);
    return prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), googleId, username },
    });
  }

  static attachGoogleId(id: string, googleId: string): Promise<TUser> {
    return prisma.user.update({ where: { id }, data: { googleId } });
  }

  /** Positive `delta` credits, negative debits. Never lets balance go
   * negative — the caller (bounty.service.ts) checks affordability first,
   * but this is the actual backstop against a race between two requests. */
  static adjustBalance(id: string, delta: number) {
    if (delta >= 0) {
      return prisma.user.update({ where: { id }, data: { balance: { increment: delta } } });
    }
    return prisma.user.updateMany({
      where: { id, balance: { gte: -delta } },
      data: { balance: { increment: delta } },
    });
  }
}
