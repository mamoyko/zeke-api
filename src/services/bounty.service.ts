import BountyRepo from "../repositories/bounty.repository";
import UserRepo from "../repositories/user.repository";
import { randomWordOptions, ANIME_WORDS, type TAnimeWord } from "../data/anime-words";
import { badRequest, notFound, unauthorized } from "../utils/errors";
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
