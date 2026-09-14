export interface TDailyStatus {
  date: string;
  playedToday: boolean;
  won: boolean | null;
  streak: number;
  longest: number;
}

/** The shape daily.repository.ts reads/writes for a single person's streak row. */
export interface TStreak {
  userId: string;
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}
