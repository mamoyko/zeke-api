import { prisma } from "../utils/prisma";
import type { TStreak } from "../models/daily.model";

export default class DailyRepo {
  static findCompletion(userId: string, date: string) {
    return prisma.dailyCompletion.findUnique({ where: { userId_date: { userId, date } } });
  }

  static createCompletion(userId: string, date: string, won: boolean, mistakes: number) {
    return prisma.dailyCompletion.create({ data: { userId, date, won, mistakes } });
  }

  static async findStreak(userId: string): Promise<TStreak> {
    const row = await prisma.streak.findUnique({ where: { userId } });
    return row ?? { userId, current: 0, longest: 0, lastCompletedDate: null };
  }

  static saveStreak(row: TStreak) {
    return prisma.streak.upsert({
      where: { userId: row.userId },
      create: row,
      update: {
        current: row.current,
        longest: row.longest,
        lastCompletedDate: row.lastCompletedDate,
      },
    });
  }
}
