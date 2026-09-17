import FriendRepo from "../repositories/friend.repository";
import UserRepo from "../repositories/user.repository";
import { toPlayerCard, type TPlayerCard } from "../models/user.model";
import { badRequest, notFound } from "../utils/errors";
import { looksLikeEmail } from "../utils/username";

export default class FriendSvc {
  static async list(userId: string): Promise<TPlayerCard[]> {
    const rows = await FriendRepo.list(userId);
    return rows.map((row) => toPlayerCard(row.friend));
  }

  static async add(userId: string, handle: string): Promise<TPlayerCard> {
    const friend = await findPlayer(handle);
    if (!friend) throw notFound("No Zeke Mobile player found with that username or email.");
    if (friend.id === userId) throw badRequest("That's you.");

    await FriendRepo.add(userId, friend.id);
    return toPlayerCard(friend);
  }

  static async remove(userId: string, friendId: string): Promise<void> {
    await FriendRepo.remove(userId, friendId);
  }
}

export async function findPlayer(handle: string) {
  const q = handle.trim();
  if (!q) return null;
  return looksLikeEmail(q) ? UserRepo.findByEmail(q) : UserRepo.findByUsername(q);
}
