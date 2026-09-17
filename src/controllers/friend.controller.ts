import { Request, Response } from "express";
import { z } from "zod";
import FriendSvc from "../services/friend.service";
import { badRequest, describeError } from "../utils/errors";

const addSchema = z.object({
  to: z.string().trim().min(1, "Enter a username or email."),
});

export default class FriendCtrl {
  static async list(req: Request, res: Response) {
    try {
      const friends = await FriendSvc.list(req.userId as string);
      return res.json({ friends });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async add(req: Request, res: Response) {
    try {
      const parsed = addSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

      const friend = await FriendSvc.add(req.userId as string, parsed.data.to);
      return res.status(201).json(friend);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      await FriendSvc.remove(req.userId as string, req.params.id);
      return res.json({ ok: true });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }
}
