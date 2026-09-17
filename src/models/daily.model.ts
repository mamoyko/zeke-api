export interface TDailyStatus {
  date: string;
  playedToday: boolean;
  won: boolean | null;
  streak: number;
  longest: number;
}

/** One row on the DAILY tab's board — never an email. */
export interface TLeaderboardRow {
  rank: number;
  name: string;
  username: string;
  me: boolean;
  mistakes?: number;
  streak?: number;
}

export interface TDailyLeaderboard {
  date: string;
  today: TLeaderboardRow[];
  streaks: TLeaderboardRow[];
}

/** The shape daily.repository.ts reads/writes for a single person's streak row. */
export interface TStreak {
  userId: string;
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}
