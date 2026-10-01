export type TPlaySource = "play" | "panic";

export interface TPlayReward {
  awarded: number;
  balance: number;
  capped: boolean;
  playWins: number;
  panicWins: number;
}

export type TRankPeriod = "today" | "week" | "all";

/** One row on the v2 GLOBAL RANKING sheet — never an email. */
export interface TRankRow {
  rank: number;
  name: string;
  username: string;
  score: number;
  rounds: number;
  me: boolean;
}

export interface TPlayLeaderboard {
  period: TRankPeriod;
  rows: TRankRow[];
}
