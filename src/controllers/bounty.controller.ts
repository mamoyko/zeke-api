import { Request, Response } from "express";
import { z } from "zod";
import BountySvc from "../services/bounty.service";
import { badRequest, describeError } from "../utils/errors";

const createSchema = z.object({
  recipientEmail: z.string().trim().email("Enter a valid email address."),
  word: z.string().trim().min(1),
  wager: z.number().int().positive(),
});

const completeSchema = z.object({
  won: z.boolean(),
  mistakes: z.number().int().min(0),
});

export default class BountyCtrl {
  static async wordOptions(_req: Request, res: Response) {
    return res.json({ words: BountySvc.wordOptions() });
  }

  static async wallet(req: Request, res: Response) {
    try {
      const balance = await BountySvc.wallet(req.userId as string);
      return res.json({ balance });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

      const { recipientEmail, word, wager } = parsed.data;
      const bounty = await BountySvc.create(req.userId as string, recipientEmail, word, wager);
      return res.status(201).json(bounty);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async incoming(req: Request, res: Response) {
    try {
      const bounties = await BountySvc.listIncoming(req.userId as string);
      return res.json({ bounties });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async sent(req: Request, res: Response) {
    try {
      const bounties = await BountySvc.listSent(req.userId as string);
      return res.json({ bounties });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async play(req: Request, res: Response) {
    try {
      const result = await BountySvc.play(req.params.id, req.userId as string);
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
      const result = await BountySvc.complete(req.params.id, req.userId as string, won, mistakes);
      return res.json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }
}
