import DeviceTokenRepo from "../repositories/device-token.repository";
import { sendPush } from "../utils/push";

export default class PushSvc {
  static async registerToken(userId: string, token: string, platform: string): Promise<void> {
    await DeviceTokenRepo.upsert(userId, token, platform);
  }

  static async unregisterToken(userId: string, token: string): Promise<void> {
    await DeviceTokenRepo.deleteByToken(userId, token);
  }

  /**
   * Pushes to every device this person has registered, then prunes any
   * token FCM reports as dead — so a person who reinstalled the app or
   * hasn't opened it in months doesn't quietly accumulate stale tokens that
   * get retried (and fail) forever.
   */
  static async notifyUser(
    userId: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ): Promise<void> {
    const tokens = await DeviceTokenRepo.findTokensByUserId(userId);
    if (tokens.length === 0) return;

    const { deadTokens } = await sendPush(tokens, title, body, data);
    if (deadTokens.length > 0) {
      await DeviceTokenRepo.deleteByTokens(deadTokens);
    }
  }
}
