import DailyRepo from "../repositories/daily.repository";
import { dayKey } from "../data/daily-words";
import { wordOfTheDay, type WordOfTheDay } from "../data/wotd";
import { badRequest, conflict } from "../utils/errors";
import type { TDailyLeaderboard, TDailyStatus } from "../models/daily.model";

function yesterday(dateKey: string): string {
  return dayKey(new Date(Date.parse(`${dateKey}T00:00:00Z`) - 86_400_000));
}

export default class DailySvc {
  /** The word every player gets today, with its Word of the Day label and
   * clues. No auth needed to know *what* it is — only completing it needs an
   * account, to track a streak against. */
  static today(): WordOfTheDay {
    return wordOfTheDay(dayKey());
  }

  /**
   * A past day's word, for the v2 game's ‹ › day browser. Practice only —
   * nothing here is recorded, and `/daily/complete` always means today.
   * Future days are refused so the browser can't spoil tomorrow's word.
   */
  static word(date: string): WordOfTheDay & { isToday: boolean } {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      throw badRequest("Dates look like YYYY-MM-DD.");
    }
    const today = dayKey();
    if (date > today) throw badRequest("No peeking at future words.");
    return { ...wordOfTheDay(date), isToday: date === today };
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
  static async complete(
    userId: string,
    won: boolean,
    mistakes: number,
    playedOn?: string,
  ): Promise<TDailyStatus> {
    const date = dayKey();
    if (playedOn !== undefined && playedOn !== date) {
      throw conflict("That day's word is over — this round was practice.");
    }

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

  /** Today's solvers by fewest mistakes, plus current Daily streaks. Optional
   * on the DAILY tab — a failed fetch must never block the word itself. */
  static async leaderboard(userId: string): Promise<TDailyLeaderboard> {
    const date = dayKey();
    const [wins, streaks] = await Promise.all([
      DailyRepo.listTodayWins(date),
      DailyRepo.listTopStreaks(),
    ]);

    return {
      date,
      today: wins.map((row, i) => ({
        rank: i + 1,
        name: row.user.name,
        username: row.user.username,
        mistakes: row.mistakes,
        me: row.userId === userId,
      })),
      streaks: streaks.map((row, i) => ({
        rank: i + 1,
        name: row.user.name,
        username: row.user.username,
        streak: row.current,
        me: row.userId === userId,
      })),
    };
  }
}
