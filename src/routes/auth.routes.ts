import { Router } from "express";
import { z } from "zod";
import { asyncHandler, badRequest, unauthorized } from "../errors";
import { requireAuth } from "../middleware/auth";
import { exchangeGoogleCode } from "../services/google.service";
import { signToken } from "../services/token.service";
import { createLocal, findByEmail, findById, findOrCreateGoogleUser, verifyPassword } from "../services/users.service";
import { toPublicUser, type AuthedRequest } from "../types";

export const authRoutes = Router();

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password needs at least 6 characters."),
});

authRoutes.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0].message);

    const { name, email, password } = parsed.data;
    const user = await createLocal(name, email, password);
    res.status(201).json({ token: signToken(user.id), user: toPublicUser(user) });
  }),
);

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string(),
});

authRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("Enter a valid email and password.");

    const { email, password } = parsed.data;
    const user = findByEmail(email);
    if (!user) throw unauthorized("No account found for that email.");
    if (!user.password_hash) {
      throw unauthorized("This email uses Google Sign-In. Continue with Google instead.");
    }
    if (!(await verifyPassword(user, password))) {
      throw unauthorized("Incorrect password.");
    }

    res.json({ token: signToken(user.id), user: toPublicUser(user) });
  }),
);

const googleSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(1),
  redirectUri: z.string().min(1),
});

authRoutes.post(
  "/google",
  asyncHandler(async (req, res) => {
    const parsed = googleSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest("Missing sign-in details.");

    const { code, codeVerifier, redirectUri } = parsed.data;
    const profile = await exchangeGoogleCode(code, codeVerifier, redirectUri);
    const user = findOrCreateGoogleUser(profile.googleId, profile.email, profile.name);

    res.json({ token: signToken(user.id), user: toPublicUser(user) });
  }),
);

authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = findById((req as AuthedRequest).userId);
    if (!user) throw unauthorized();
    res.json({ user: toPublicUser(user) });
  }),
);
