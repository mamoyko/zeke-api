import PlayRepo from "../repositories/play.repository";
import { dayKey } from "../data/daily-words";
import { badRequest } from "../utils/errors";
import type {
  TPlayLeaderboard,
  TPlayReward,
  TPlaySource,
  TRankPeriod,
} from "../models/play.model";

/** PLAY is the common loop — smaller payout, higher daily cap.
 * PANIC is shorter and harder to finish — fewer paying wins, more coins each. */
const PAYOUT: Record<TPlaySource, { coins: number; cap: number }> = {
  play: { coins: 5, cap: 8 },
  panic: { coins: 8, cap: 5 },
};

/** Most a single v2 NORMAL round can pay: 5 per letter across all 26, plus
 * the 10 word bonus and the 20 perfect bonus. A submitted run can't average
 * more than this per round — the only sanity check a client-reported score
 * gets, same trust model as the coin rewards above. */
const MAX_ROUND_POINTS = 26 * 5 + 10 + 20;

/** Rows on the GLOBAL RANKING sheet before "YOU" is appended below them. */
const BOARD_SIZE = 8;

/** Start of the ranking window, in UTC like every other "day" here. */
function periodStart(period: TRankPeriod, now = new Date()): Date {
  if (period === "all") return new Date(0);
  const midnight = new Date(`${dayKey(now)}T00:00:00Z`);
  if (period === "today") return midnight;
  // "THIS WEEK" runs from Monday 00:00 UTC.
  const sinceMonday = (midnight.getUTCDay() + 6) % 7;
  return new Date(midnight.getTime() - sinceMonday * 86_400_000);
}

export default class PlaySvc {
  /**
   * Credits the wallet for one PLAY or PANIC win. Same trust model as
   * `POST /daily/complete`: the client reports the win, the server only
   * enforces a per-person per-day cap so a modified client cannot print
   * coins without bound.
   */
  static async reward(userId: string, source: TPlaySource): Promise<TPlayReward> {
    const spec = PAYOUT[source];
    if (!spec) throw badRequest("Unknown reward source.");

    return PlayRepo.claimAndCredit(userId, dayKey(), source, spec.cap, spec.coins);
  }

  /** Records a finished NORMAL run. Empty runs (0 points) are dropped
   * rather than stored — they could never place on a board anyway. */
  static async submitScore(userId: string, score: number, rounds: number): Promise<{ stored: boolean }> {
    if (score > rounds * MAX_ROUND_POINTS) throw badRequest("That score doesn't add up.");
    if (score === 0) return { stored: false };
    await PlayRepo.createRun(userId, score, rounds);
    return { stored: true };
  }

  static async leaderboard(userId: string, period: TRankPeriod): Promise<TPlayLeaderboard> {
    const rows = await PlayRepo.bestRuns(periodStart(period), userId, BOARD_SIZE);
    return {
      period,
      rows: rows.map((row) => ({
        rank: Number(row.rank),
        name: row.name,
        username: row.username,
        score: row.score,
        rounds: row.rounds,
        me: row.userId === userId,
      })),
    };
  }
}
