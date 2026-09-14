import { prisma } from "../db";
import { dayKey, wordForDay } from "../data/dailyWords";

export interface DailyStatus {
  date: string;
  playedToday: boolean;
  won: boolean | null;
  streak: number;
  longest: number;
}

interface StreakRow {
  userId: string;
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}

function yesterday(dateKey: string): string {
  return dayKey(new Date(Date.parse(`${dateKey}T00:00:00Z`) - 86_400_000));
}

async function getStreakRow(userId: string): Promise<StreakRow> {
  const row = await prisma.streak.findUnique({ where: { userId } });
  return row ?? { userId, current: 0, longest: 0, lastCompletedDate: null };
}

function saveStreakRow(row: StreakRow): Promise<unknown> {
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

/** The word every player gets today. No auth needed to know *what* it is — only completing it needs an account, to track a streak against. */
export function today(): { date: string; word: string; category: string } {
  const date = dayKey();
  const { word, category } = wordForDay(date);
  return { date, word, category };
}

export async function getStatus(userId: string): Promise<DailyStatus> {
  const date = dayKey();
  const completion = await prisma.dailyCompletion.findUnique({
    where: { userId_date: { userId, date } },
  });
  const streak = await getStreakRow(userId);

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
export async function complete(
  userId: string,
  won: boolean,
  mistakes: number,
): Promise<DailyStatus> {
  const date = dayKey();

  const already = await prisma.dailyCompletion.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (already) {
    return getStatus(userId);
  }

  await prisma.dailyCompletion.create({ data: { userId, date, won, mistakes } });

  const streak = await getStreakRow(userId);
  if (won) {
    // A streak only continues if yesterday's win is what's on record — any
    // gap (a missed day, or yesterday being a loss) restarts it at 1 rather
    // than 0, since today's win still counts as day one of a new streak.
    streak.current = streak.lastCompletedDate === yesterday(date) ? streak.current + 1 : 1;
    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastCompletedDate = date;
  } else {
    // A loss breaks the current streak. `lastCompletedDate` deliberately
    // stays untouched here — it only ever records the date of a *win*, so a
    // win tomorrow correctly sees "yesterday was not a win" and restarts at 1.
    streak.current = 0;
  }
  await saveStreakRow(streak);

  return getStatus(userId);
}
