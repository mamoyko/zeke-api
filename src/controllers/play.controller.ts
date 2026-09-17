import { Request, Response } from "express";
import { z } from "zod";
import PlaySvc from "../services/play.service";
import { badRequest, describeError } from "../utils/errors";

const rewardSchema = z.object({
  source: z.enum(["play", "panic"]),
});

export default class PlayCtrl {
  static async reward(req: Request, res: Response) {
    try {
      const parsed = rewardSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest("Missing or invalid reward source.");

      const result = await PlaySvc.reward(req.userId as string, parsed.data.source);
      return res.json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }
}
