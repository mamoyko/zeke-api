import bcrypt from "bcryptjs";
import UserRepo from "../repositories/user.repository";
import { signToken } from "../utils/token";
import { badRequest, conflict, unauthorized } from "../utils/errors";
import { looksLikeEmail, normalizeUsername, USERNAME_PATTERN } from "../utils/username";
import { toPublicUser, type TPublicUser } from "../models/user.model";

const BCRYPT_ROUNDS = 10;

export interface TAuthResult {
  token: string;
  user: TPublicUser;
}

export default class AuthSvc {
  /** `username` is optional: the app's sign-up form picks one, older clients
   * don't and get one allocated from `name`. */
  static async signup(
    name: string,
    email: string,
    password: string,
    username?: string,
  ): Promise<TAuthResult> {
    if (username !== undefined) {
      username = normalizeUsername(username);
      if (!USERNAME_PATTERN.test(username)) {
        throw badRequest("Usernames are 3-20 letters, numbers or _.");
      }
      if (await UserRepo.findByUsername(username)) {
        throw conflict("That username is taken.");
      }
    }
    if (await UserRepo.findByEmail(email)) {
      throw conflict("An account with that email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await UserRepo.createLocal(name, email, passwordHash, username);
    return { token: signToken(user.id), user: toPublicUser(user) };
  }

  /** `login` is a username or an email address. */
  static async login(login: string, password: string): Promise<TAuthResult> {
    const byEmail = looksLikeEmail(login);
    const user = byEmail
      ? await UserRepo.findByEmail(login)
      : await UserRepo.findByUsername(login);
    if (!user) {
      throw unauthorized(`No account found for that ${byEmail ? "email" : "username"}.`);
    }
    if (!user.passwordHash) {
      throw unauthorized("This account uses Google Sign-In, so it has no password.");
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
