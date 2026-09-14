import { prisma } from "../utils/prisma";
import type { TBounty } from "../models/bounty.model";

export default class BountyRepo {
  static create(data: {
    senderId: string;
    recipientId: string;
    word: string;
    category: string;
    wager: number;
    reward: number;
  }): Promise<TBounty> {
    return prisma.bounty.create({ data });
  }

  static findById(id: string): Promise<TBounty | null> {
    return prisma.bounty.findUnique({ where: { id } });
  }

  static listIncoming(recipientId: string) {
    return prisma.bounty.findMany({
      where: { recipientId },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { name: true } } },
    });
  }

  static listSent(senderId: string) {
    return prisma.bounty.findMany({
      where: { senderId },
      orderBy: { createdAt: "desc" },
      include: { recipient: { select: { name: true, email: true } } },
    });
  }

  /** Only succeeds once per bounty — the `status: "pending"` guard makes this
   * atomic against two concurrent /complete calls for the same bounty in the
   * same way daily.repository.ts's (userId, date) primary key does for the
   * Daily Challenge. */
  static resolve(id: string, won: boolean, mistakes: number) {
    return prisma.bounty.updateMany({
      where: { id, status: "pending" },
      data: { status: won ? "won" : "lost", mistakes, resolvedAt: new Date() },
    });
  }
}
