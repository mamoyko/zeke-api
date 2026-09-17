import PlayRepo from "../repositories/play.repository";
import { dayKey } from "../data/daily-words";
import { badRequest } from "../utils/errors";
import type { TPlayReward, TPlaySource } from "../models/play.model";

/** PLAY is the common loop — smaller payout, higher daily cap.
 * PANIC is shorter and harder to finish — fewer paying wins, more coins each. */
const PAYOUT: Record<TPlaySource, { coins: number; cap: number }> = {
  play: { coins: 5, cap: 8 },
  panic: { coins: 8, cap: 5 },
};

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
}
