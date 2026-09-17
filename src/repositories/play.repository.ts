import { prisma } from "../utils/prisma";

export default class PlayRepo {
  /** Atomically: ensure today's row, increment the win counter if under cap,
   * credit the wallet. Returns how many coins were awarded this call (0 if
   * already at the cap) plus the resulting balance and counters. */
  static claimAndCredit(
    userId: string,
    date: string,
    source: "play" | "panic",
    cap: number,
    coins: number,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.playRewardDay.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date },
        update: {},
      });

      const claimed =
        source === "panic"
          ? await tx.playRewardDay.updateMany({
              where: { userId, date, panicWins: { lt: cap } },
              data: { panicWins: { increment: 1 }, coins: { increment: coins } },
            })
          : await tx.playRewardDay.updateMany({
              where: { userId, date, playWins: { lt: cap } },
              data: { playWins: { increment: 1 }, coins: { increment: coins } },
            });

      const awarded = claimed.count === 1 ? coins : 0;
      const user =
        awarded > 0
          ? await tx.user.update({
              where: { id: userId },
              data: { balance: { increment: awarded } },
            })
          : await tx.user.findUniqueOrThrow({ where: { id: userId } });

      const day = await tx.playRewardDay.findUniqueOrThrow({
        where: { userId_date: { userId, date } },
      });

      return {
        awarded,
        balance: user.balance,
        capped: awarded === 0,
        playWins: day.playWins,
        panicWins: day.panicWins,
      };
    });
  }
}
