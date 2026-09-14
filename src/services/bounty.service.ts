import BountyRepo from "../repositories/bounty.repository";
import UserRepo from "../repositories/user.repository";
import { randomWordOptions, ANIME_WORDS, type TAnimeWord } from "../data/anime-words";
import { badRequest, notFound, unauthorized } from "../utils/errors";
import { sendEmail } from "../utils/mailer";
import PushSvc from "./push.service";
import type { TIncomingBounty, TSentBounty } from "../models/bounty.model";

const WORD_OPTIONS_COUNT = 5;
const REWARD_MULTIPLIER = 2; // Double-or-nothing: sender risks `wager`, gets `wager * 2` back on a fail.

export default class BountySvc {
  static wordOptions(): TAnimeWord[] {
    return randomWordOptions(WORD_OPTIONS_COUNT);
  }

  static async wallet(userId: string): Promise<number> {
    const user = await UserRepo.findById(userId);
    if (!user) throw unauthorized();
    return user.balance;
  }

  static async create(
    senderId: string,
    recipientEmail: string,
    word: string,
    wager: number,
  ): Promise<TSentBounty> {
    if (wager <= 0) throw badRequest("Wager must be a positive number of coins.");

    const upperWord = word.trim().toUpperCase();
    if (!ANIME_WORDS.some((w) => w.word === upperWord)) {
      throw badRequest("That word isn't from the Anime pool. Fetch options first.");
    }

    const recipient = await UserRepo.findByEmail(recipientEmail);
    if (!recipient) throw notFound("No Zeke Mobile player found with that email.");
    if (recipient.id === senderId) throw badRequest("You can't send a bounty to yourself.");

    const debited = await UserRepo.adjustBalance(senderId, -wager);
    if ("count" in debited && debited.count === 0) {
      throw badRequest("Not enough coins for that wager.");
    }

    const bounty = await BountyRepo.create({
      senderId,
      recipientId: recipient.id,
      word: upperWord,
      category: "Anime",
      wager,
      reward: wager * REWARD_MULTIPLIER,
    });

    // Best-effort — see sendEmail()'s / sendPush()'s own doc comments for why
    // a mail or push hiccup here must never turn into a failure response for
    // a bounty that has already been created and paid for.
    const sender = await UserRepo.findById(senderId);
    void this.notifyRecipient(
      sender?.name ?? "Someone",
      recipient.id,
      recipient.email,
      bounty.id,
      bounty.wager,
      bounty.reward,
    );

    return {
      id: bounty.id,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      category: bounty.category,
      wager: bounty.wager,
      reward: bounty.reward,
      status: bounty.status as TSentBounty["status"],
      createdAt: bounty.createdAt.toISOString(),
    };
  }

  /** Lets a recipient know a bounty is waiting for them, two ways at once —
   * email always attempted, push only reaching whatever devices they've
   * registered (see PushSvc). Neither is awaited by a caller that needs its
   * result; see sendEmail()'s and sendPush()'s own doc comments for why. */
  private static async notifyRecipient(
    senderName: string,
    recipientId: string,
    recipientEmail: string,
    bountyId: string,
    wager: number,
    reward: number,
  ): Promise<void> {
    await Promise.all([
      sendEmail(
        recipientEmail,
        `${senderName} sent you a Word Bounty`,
        `<p><strong>${senderName}</strong> just sent you a Word Bounty on Zeke Mobile.</p>
         <p>They staked <strong>${wager} coins</strong> that you can't solve it.
         Beat it and you take their stake. Fail, and they walk away with
         <strong>${reward} coins</strong>.</p>
         <p>Open the app and check the BOUNTY tab to see it.</p>
         <p style="color:#7E8770;font-size:12px">— Zeke, probably smug about this</p>`,
      ),
      PushSvc.notifyUser(
        recipientId,
        "New Word Bounty!",
        `${senderName} bet ${wager} coins you can't solve their word.`,
        { type: "bounty", bountyId },
      ),
    ]);
  }

  static async listIncoming(userId: string): Promise<TIncomingBounty[]> {
    const rows = await BountyRepo.listIncoming(userId);
    return rows.map((b) => ({
      id: b.id,
      senderName: b.sender.name,
      category: b.category,
      wager: b.wager,
      reward: b.reward,
      status: b.status as TIncomingBounty["status"],
      createdAt: b.createdAt.toISOString(),
    }));
  }

  static async listSent(userId: string): Promise<TSentBounty[]> {
    const rows = await BountyRepo.listSent(userId);
    return rows.map((b) => ({
      id: b.id,
      recipientName: b.recipient.name,
      recipientEmail: b.recipient.email,
      category: b.category,
      wager: b.wager,
      reward: b.reward,
      status: b.status as TSentBounty["status"],
      createdAt: b.createdAt.toISOString(),
    }));
  }

  /** Reveals the word — only to the recipient it was sent to, and only while
   * it's still pending (a resolved bounty has nothing left to "play"). */
  static async play(
    bountyId: string,
    userId: string,
  ): Promise<{ id: string; word: string; category: string; wager: number; reward: number }> {
    const bounty = await BountyRepo.findById(bountyId);
    if (!bounty) throw notFound("Bounty not found.");
    if (bounty.recipientId !== userId) throw unauthorized("This isn't your bounty.");
    if (bounty.status !== "pending") throw badRequest("This bounty has already been played.");

    return {
      id: bounty.id,
      word: bounty.word,
      category: bounty.category,
      wager: bounty.wager,
      reward: bounty.reward,
    };
  }

  /**
   * Idempotent per bounty, the same way daily.service.ts's complete() is
   * idempotent per day: a second call (retry, race) just returns whatever
   * was already resolved instead of paying out twice.
   */
  static async complete(
    bountyId: string,
    userId: string,
    won: boolean,
    mistakes: number,
  ): Promise<{ status: string; wager: number; reward: number }> {
    const bounty = await BountyRepo.findById(bountyId);
    if (!bounty) throw notFound("Bounty not found.");
    if (bounty.recipientId !== userId) throw unauthorized("This isn't your bounty.");

    if (bounty.status === "pending") {
      const resolved = await BountyRepo.resolve(bountyId, won, mistakes);
      if (resolved.count === 1) {
        if (won) {
          await UserRepo.adjustBalance(bounty.recipientId, bounty.wager);
        } else {
          await UserRepo.adjustBalance(bounty.senderId, bounty.reward);
        }
      }
    }

    const current = await BountyRepo.findById(bountyId);
    return {
      status: current!.status,
      wager: current!.wager,
      reward: current!.reward,
    };
  }
}
