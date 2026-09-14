import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, googleConfigured } from "../config";
import { badRequest } from "../utils/errors";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export interface TGoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

/**
 * Finishes the PKCE flow the Godot client started: the client did the
 * browser + loopback-redirect dance and handed us the resulting
 * authorization `code` plus the `code_verifier` it generated. From here it's
 * two plain server-to-server calls to Google — this used to happen inside
 * the game client itself (see the game's scripts/google_oauth.gd history),
 * moved here so GOOGLE_CLIENT_SECRET lives only on this server and never
 * ships inside the app.
 */
export default class GoogleAuthSvc {
  static async exchangeCode(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<TGoogleProfile> {
    if (!googleConfigured()) {
      throw badRequest("Google Sign-In isn't configured on this server yet. See auth/README.md.");
    }

    const tokenBody = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });
    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error_description?: string;
    };
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw badRequest(
        `Google rejected the sign-in request${
          tokenData.error_description ? `: ${tokenData.error_description}` : "."
        }`,
      );
    }

    const profileResponse = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      name?: string;
    };
    if (!profileResponse.ok || !profileData.sub || !profileData.email) {
      throw badRequest("Google signed you in but didn't return a profile.");
    }

    return {
      googleId: profileData.sub,
      email: profileData.email,
      name: profileData.name ?? profileData.email,
    };
  }
}
