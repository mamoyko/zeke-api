import { prisma } from "../utils/prisma";

interface TBestRunRow {
  userId: string;
  name: string;
  username: string;
  score: number;
  rounds: number;
  rank: bigint;
}

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

  static createRun(userId: string, score: number, rounds: number) {
    return prisma.scoreRun.create({ data: { userId, score, rounds } });
  }

  /**
   * Each player's best run since `since` (highest score; more rounds, then
   * earlier, breaks ties), ranked. Returns the top `take` plus the caller's
   * own row wherever it lands, so the sheet can always show "YOU".
   */
  static bestRuns(since: Date, userId: string, take: number) {
    return prisma.$queryRaw<TBestRunRow[]>`
      WITH best AS (
        SELECT DISTINCT ON (s.user_id) s.user_id, s.score, s.rounds, s.created_at
        FROM score_runs s
        WHERE s.created_at >= ${since}
        ORDER BY s.user_id, s.score DESC, s.rounds DESC, s.created_at ASC
      ), ranked AS (
        SELECT b.*, ROW_NUMBER() OVER (
          ORDER BY b.score DESC, b.rounds DESC, b.created_at ASC
        ) AS rank
        FROM best b
      )
      SELECT r.user_id AS "userId", u.name, u.username, r.score, r.rounds, r.rank
      FROM ranked r
      JOIN users u ON u.id = r.user_id
      WHERE r.rank <= ${take} OR r.user_id = ${userId}
      ORDER BY r.rank`;
  }
}
