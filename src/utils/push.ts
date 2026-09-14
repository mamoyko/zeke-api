import { existsSync } from "node:fs";
import { initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { FIREBASE_SERVICE_ACCOUNT_PATH } from "../config";

// Token error codes FCM returns when a device has uninstalled the app or the
// token has otherwise expired — verified against the actual installed
// firebase-admin package (node_modules/firebase-admin/lib/messaging/error.d.ts),
// not guessed from memory. A token failing with either of these is never
// going to succeed again, so it's pruned from device_tokens rather than
// retried on the next push.
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

let app: App | null | undefined; // undefined = not attempted yet, null = attempted and failed/absent.

function firebaseApp(): App | null {
  if (app !== undefined) return app;

  if (!FIREBASE_SERVICE_ACCOUNT_PATH || !existsSync(FIREBASE_SERVICE_ACCOUNT_PATH)) {
    app = null;
    return app;
  }

  try {
    app = initializeApp({ credential: cert(FIREBASE_SERVICE_ACCOUNT_PATH) });
  } catch (error) {
    console.error("[push] Could not initialize Firebase from FIREBASE_SERVICE_ACCOUNT_PATH:", error);
    app = null;
  }
  return app;
}

export const pushConfigured = (): boolean => firebaseApp() !== null;

export interface PushResult {
  /** Tokens FCM says are dead — pass these to DeviceTokenRepo to delete them. */
  deadTokens: string[];
}

/**
 * Sends one notification to every token given, in a single FCM multicast
 * call. Deliberately never throws — see mailer.ts's `sendEmail` for the same
 * reasoning: a push failure is not a reason to fail whatever already
 * succeeded (a bounty that already exists, coins that already moved).
 */
export async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<PushResult> {
  if (tokens.length === 0) return { deadTokens: [] };

  const firebase = firebaseApp();
  if (!firebase) {
    console.log(`[push] Firebase not configured — skipping push to ${tokens.length} device(s): "${title}"`);
    return { deadTokens: [] };
  }

  try {
    const response = await getMessaging(firebase).sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });

    const deadTokens: string[] = [];
    response.responses.forEach((result, i) => {
      if (!result.success && result.error && DEAD_TOKEN_CODES.has(result.error.code)) {
        deadTokens.push(tokens[i]);
      } else if (!result.success) {
        console.error(`[push] FCM rejected a message to one device:`, result.error);
      }
    });
    return { deadTokens };
  } catch (error) {
    console.error("[push] Failed to reach Firebase Cloud Messaging:", error);
    return { deadTokens: [] };
  }
}
