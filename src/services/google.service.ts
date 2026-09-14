import { config, googleConfigured } from "../config";
import { badRequest } from "../errors";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

/**
 * Finishes the PKCE flow the Godot client started: the client did the
 * browser + loopback-redirect dance and handed us the resulting
 * authorization `code` plus the `code_verifier` it generated. From here it's
 * two plain server-to-server calls to Google — this is exactly what used to
 * happen inside the game client (see the old scripts/google_oauth.gd), moved
 * here so `GOOGLE_CLIENT_SECRET` lives only on this server and never ships
 * inside the app.
 */
export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<GoogleProfile> {
  if (!googleConfigured()) {
    throw badRequest(
      "Google Sign-In isn't configured on this server yet. See auth/README.md.",
    );
  }

  const tokenBody = new URLSearchParams({
    code,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
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
