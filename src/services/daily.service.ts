import DailyRepo from "../repositories/daily.repository";
import { dayKey, wordForDay } from "../data/daily-words";
import type { TDailyStatus } from "../models/daily.model";

function yesterday(dateKey: string): string {
  return dayKey(new Date(Date.parse(`${dateKey}T00:00:00Z`) - 86_400_000));
}

export default class DailySvc {
  /** The word every player gets today. No auth needed to know *what* it is — only completing it needs an account, to track a streak against. */
  static today(): { date: string; word: string; category: string } {
    const date = dayKey();
    const { word, category } = wordForDay(date);
    return { date, word, category };
  }

  static async status(userId: string): Promise<TDailyStatus> {
    const date = dayKey();
    const completion = await DailyRepo.findCompletion(userId, date);
    const streak = await DailyRepo.findStreak(userId);

    return {
      date,
      playedToday: completion !== null,
      won: completion ? completion.won : null,
      streak: streak.current,
      longest: streak.longest,
    };
  }

  /**
   * Records today's one attempt and updates the streak. Idempotent per user
   * per day — a second call the same day (a re-sent request, a client retry)
   * returns the already-recorded result rather than counting twice, which is
   * what makes "one shot" a server-enforced rule rather than just an honor
   * system in the client.
   */
  static async complete(userId: string, won: boolean, mistakes: number): Promise<TDailyStatus> {
    const date = dayKey();

    if (await DailyRepo.findCompletion(userId, date)) {
      return this.status(userId);
    }
    await DailyRepo.createCompletion(userId, date, won, mistakes);

    const streak = await DailyRepo.findStreak(userId);
    if (won) {
      // A streak only continues if yesterday's win is what's on record — any
      // gap (a missed day, or yesterday being a loss) restarts it at 1
      // rather than 0, since today's win still counts as day one of a new
      // streak.
      streak.current = streak.lastCompletedDate === yesterday(date) ? streak.current + 1 : 1;
      streak.longest = Math.max(streak.longest, streak.current);
      streak.lastCompletedDate = date;
    } else {
      // A loss breaks the current streak. `lastCompletedDate` deliberately
      // stays untouched here — it only ever records the date of a *win*, so
      // a win tomorrow correctly sees "yesterday was not a win" and restarts
      // at 1.
      streak.current = 0;
    }
    await DailyRepo.saveStreak(streak);

    return this.status(userId);
  }
}
