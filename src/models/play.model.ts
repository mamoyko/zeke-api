export type TPlaySource = "play" | "panic";

export interface TPlayReward {
  awarded: number;
  balance: number;
  capped: boolean;
  playWins: number;
  panicWins: number;
}
