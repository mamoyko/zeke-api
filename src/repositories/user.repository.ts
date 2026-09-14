import { prisma } from "../utils/prisma";
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

  static createLocal(name: string, email: string, passwordHash: string): Promise<TUser> {
    return prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), passwordHash },
    });
  }

  static createGoogle(name: string, email: string, googleId: string): Promise<TUser> {
    return prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), googleId },
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
