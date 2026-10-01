import { Request, Response } from "express";
import { z } from "zod";
import PlaySvc from "../services/play.service";
import { badRequest, describeError } from "../utils/errors";

const rewardSchema = z.object({
  source: z.enum(["play", "panic"]),
});

const scoreSchema = z.object({
  score: z.number().int().min(0),
  rounds: z.number().int().min(1).max(1000),
});

const periodSchema = z.enum(["today", "week", "all"]);

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

  static async score(req: Request, res: Response) {
    try {
      const parsed = scoreSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest("Missing or invalid score.");

      const { score, rounds } = parsed.data;
      const result = await PlaySvc.submitScore(req.userId as string, score, rounds);
      return res.json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async leaderboard(req: Request, res: Response) {
    try {
      const parsed = periodSchema.safeParse(req.query.period ?? "today");
      if (!parsed.success) throw badRequest("Period is today, week or all.");

      const result = await PlaySvc.leaderboard(req.userId as string, parsed.data);
      return res.json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }
}
