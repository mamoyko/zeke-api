import { Request, Response } from "express";
import { z } from "zod";
import DailySvc from "../services/daily.service";
import { badRequest, describeError } from "../utils/errors";

const completeSchema = z.object({
  won: z.boolean(),
  mistakes: z.number().int().min(0),
});

export default class DailyCtrl {
  static async today(_req: Request, res: Response) {
    return res.json(DailySvc.today());
  }

  static async status(req: Request, res: Response) {
    try {
      const result = await DailySvc.status(req.userId as string);
      return res.json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async complete(req: Request, res: Response) {
    try {
      const parsed = completeSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest("Missing or invalid result.");

      const { won, mistakes } = parsed.data;
      const result = await DailySvc.complete(req.userId as string, won, mistakes);
      return res.json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }
}
