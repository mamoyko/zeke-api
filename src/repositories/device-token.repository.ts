import { prisma } from "../utils/prisma";

export default class DeviceTokenRepo {
  /** Registers or re-points one device token. Unique on `token`, so a device
   * that logs into a different account just moves its existing row rather
   * than accumulating duplicates. */
  static upsert(userId: string, token: string, platform: string) {
    return prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  static findTokensByUserId(userId: string): Promise<string[]> {
    return prisma.deviceToken
      .findMany({ where: { userId }, select: { token: true } })
      .then((rows) => rows.map((r) => r.token));
  }

  /** Scoped to `userId` so unregistering only ever removes a token the
   * caller actually owns, not an arbitrary token string someone else's
   * device happens to be using. */
  static deleteByToken(userId: string, token: string) {
    return prisma.deviceToken.deleteMany({ where: { token, userId } });
  }

  static deleteByTokens(tokens: string[]) {
    if (tokens.length === 0) return Promise.resolve({ count: 0 });
    return prisma.deviceToken.deleteMany({ where: { token: { in: tokens } } });
  }
}
