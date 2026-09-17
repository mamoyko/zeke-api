import { Request, Response } from "express";
import UserSvc from "../services/user.service";
import { describeError } from "../utils/errors";

export default class UserCtrl {
  static async search(req: Request, res: Response) {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : "";
      const players = await UserSvc.search(req.userId as string, q);
      return res.json({ players });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }
}
