import { Request, Response } from "express";
import { z } from "zod";
import PushSvc from "../services/push.service";
import { badRequest, describeError } from "../utils/errors";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["android", "ios"]),
});

const unregisterSchema = z.object({
  token: z.string().min(1),
});

export default class NotificationCtrl {
  static async registerDeviceToken(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest("Missing or invalid device token.");

      const { token, platform } = parsed.data;
      await PushSvc.registerToken(req.userId as string, token, platform);
      return res.status(201).json({ ok: true });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async unregisterDeviceToken(req: Request, res: Response) {
    try {
      const parsed = unregisterSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest("Missing device token.");

      await PushSvc.unregisterToken(req.userId as string, parsed.data.token);
      return res.json({ ok: true });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }
}
