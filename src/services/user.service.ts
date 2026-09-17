import UserRepo from "../repositories/user.repository";
import { toPlayerCard, type TPlayerCard } from "../models/user.model";

export default class UserSvc {
  static async search(userId: string, query: string): Promise<TPlayerCard[]> {
    const rows = await UserRepo.search(query, userId);
    return rows.map(toPlayerCard);
  }
}
