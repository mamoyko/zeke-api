import bcrypt from "bcryptjs";
import UserRepo from "../repositories/user.repository";
import { signToken } from "../utils/token";
import { conflict, unauthorized } from "../utils/errors";
import { toPublicUser, type TPublicUser } from "../models/user.model";

const BCRYPT_ROUNDS = 10;

export interface TAuthResult {
  token: string;
  user: TPublicUser;
}

export default class AuthSvc {
  static async signup(name: string, email: string, password: string): Promise<TAuthResult> {
    if (await UserRepo.findByEmail(email)) {
      throw conflict("An account with that email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await UserRepo.createLocal(name, email, passwordHash);
    return { token: signToken(user.id), user: toPublicUser(user) };
  }

  static async login(email: string, password: string): Promise<TAuthResult> {
    const user = await UserRepo.findByEmail(email);
    if (!user) throw unauthorized("No account found for that email.");
    if (!user.passwordHash) {
      throw unauthorized("This email uses Google Sign-In. Continue with Google instead.");
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw unauthorized("Incorrect password.");
    }

    return { token: signToken(user.id), user: toPublicUser(user) };
  }

  /**
   * If a local account already exists with the same email, Google sign-in
   * links onto that same account (by googleId) rather than creating a
   * duplicate — so signing up with a password and later tapping "Continue
   * with Google" with the same email lands on one account, not two.
   */
  static async continueWithGoogle(
    googleId: string,
    email: string,
    name: string,
  ): Promise<TAuthResult> {
    let user = await UserRepo.findByGoogleId(googleId);

    if (!user) {
      const byEmail = await UserRepo.findByEmail(email);
      user = byEmail ? await UserRepo.attachGoogleId(byEmail.id, googleId) : null;
    }

    if (!user) {
      user = await UserRepo.createGoogle(name || email, email, googleId);
    }

    return { token: signToken(user.id), user: toPublicUser(user) };
  }

  static async me(userId: string): Promise<TPublicUser> {
    const user = await UserRepo.findById(userId);
    if (!user) throw unauthorized();
    return toPublicUser(user);
  }
}
