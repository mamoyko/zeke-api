import { Request, Response } from "express";
import { z } from "zod";
import AuthSvc from "../services/auth.service";
import GoogleAuthSvc from "../services/google-auth.service";
import { badRequest, describeError } from "../utils/errors";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password needs at least 6 characters."),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string(),
});

const googleSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(1),
  redirectUri: z.string().min(1),
});

export default class AuthCtrl {
  static async signup(req: Request, res: Response) {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

      const { name, email, password } = parsed.data;
      const result = await AuthSvc.signup(name, email, password);
      return res.status(201).json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest("Enter a valid email and password.");

      const { email, password } = parsed.data;
      const result = await AuthSvc.login(email, password);
      return res.json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async google(req: Request, res: Response) {
    try {
      const parsed = googleSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest("Missing sign-in details.");

      const { code, codeVerifier, redirectUri } = parsed.data;
      const profile = await GoogleAuthSvc.exchangeCode(code, codeVerifier, redirectUri);
      const result = await AuthSvc.continueWithGoogle(profile.googleId, profile.email, profile.name);
      return res.json(result);
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const user = await AuthSvc.me(req.userId as string);
      return res.json({ user });
    } catch (error) {
      const { status, message } = describeError(error);
      return res.status(status).json({ error: message });
    }
  }
}
