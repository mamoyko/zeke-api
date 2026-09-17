import { prisma } from "../utils/prisma";

export default class FriendRepo {
  static list(userId: string) {
    return prisma.friendship.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { friend: { select: { id: true, name: true, username: true } } },
    });
  }

  static async add(userId: string, friendId: string) {
    if (userId === friendId) return;
    await prisma.friendship.upsert({
      where: { userId_friendId: { userId, friendId } },
      create: { userId, friendId },
      update: {},
    });
  }

  static remove(userId: string, friendId: string) {
    return prisma.friendship.deleteMany({ where: { userId, friendId } });
  }
}
