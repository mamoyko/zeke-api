import { db } from "../db";
import { dayKey, wordForDay } from "../data/dailyWords";

export interface DailyStatus {
  date: string;
  playedToday: boolean;
  won: boolean | null;
  streak: number;
  longest: number;
}

interface StreakRow {
  user_id: string;
  current: number;
  longest: number;
  last_completed_date: string | null;
}

interface CompletionRow {
  won: number;
  mistakes: number;
}

function yesterday(dateKey: string): string {
  return dayKey(new Date(Date.parse(`${dateKey}T00:00:00Z`) - 86_400_000));
}

function getStreakRow(userId: string): StreakRow {
  const row = db
    .prepare("SELECT * FROM streaks WHERE user_id = ?")
    .get(userId) as StreakRow | undefined;
  return row ?? { user_id: userId, current: 0, longest: 0, last_completed_date: null };
}

function saveStreakRow(row: StreakRow): void {
  db.prepare(
    `INSERT INTO streaks (user_id, current, longest, last_completed_date)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       current = excluded.current,
       longest = excluded.longest,
       last_completed_date = excluded.last_completed_date`,
  ).run(row.user_id, row.current, row.longest, row.last_completed_date);
}

/** The word every player gets today. No auth needed to know *what* it is — only completing it needs an account, to track a streak against. */
export function today(): { date: string; word: string; category: string } {
  const date = dayKey();
  const { word, category } = wordForDay(date);
  return { date, word, category };
}

export function getStatus(userId: string): DailyStatus {
  const date = dayKey();
  const completion = db
    .prepare("SELECT won, mistakes FROM daily_completions WHERE user_id = ? AND date = ?")
    .get(userId, date) as CompletionRow | undefined;
  const streak = getStreakRow(userId);

  return {
    date,
    playedToday: completion !== undefined,
    won: completion ? completion.won === 1 : null,
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
export function complete(userId: string, won: boolean, mistakes: number): DailyStatus {
  const date = dayKey();

  const already = db
    .prepare("SELECT won, mistakes FROM daily_completions WHERE user_id = ? AND date = ?")
    .get(userId, date) as CompletionRow | undefined;
  if (already) {
    return getStatus(userId);
  }

  db.prepare(
    "INSERT INTO daily_completions (user_id, date, won, mistakes) VALUES (?, ?, ?, ?)",
  ).run(userId, date, won ? 1 : 0, mistakes);

  const streak = getStreakRow(userId);
  if (won) {
    // A streak only continues if yesterday's win is what's on record — any
    // gap (a missed day, or yesterday being a loss) restarts it at 1 rather
    // than 0, since today's win still counts as day one of a new streak.
    streak.current = streak.last_completed_date === yesterday(date) ? streak.current + 1 : 1;
    streak.longest = Math.max(streak.longest, streak.current);
    streak.last_completed_date = date;
  } else {
    // A loss breaks the current streak. `last_completed_date` deliberately
    // stays untouched here — it only ever records the date of a *win*, so a
    // win tomorrow correctly sees "yesterday was not a win" and restarts at 1.
    streak.current = 0;
  }
  saveStreakRow(streak);

  return getStatus(userId);
}
