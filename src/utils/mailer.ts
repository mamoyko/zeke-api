import { MAIL_FROM, RESEND_API_KEY, mailConfigured } from "../config";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Sends one email via Resend's REST API (https://resend.com) — a plain
 * `fetch` call, not their SDK, matching how `google-auth.service.ts` talks to
 * Google directly rather than pulling in a client library for one endpoint.
 *
 * Deliberately never throws. Email is a nice-to-have on top of a bounty that
 * already exists in the database — a mail provider hiccup should show up in
 * the logs, not turn into a 500 on `POST /bounties` for something that
 * already succeeded.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!mailConfigured()) {
    console.log(`[mailer] RESEND_API_KEY not set — skipping email to ${to}: "${subject}"`);
    return;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: MAIL_FROM, to, subject, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[mailer] Resend rejected an email to ${to} (${response.status}): ${body}`);
    }
  } catch (error) {
    console.error(`[mailer] Failed to reach Resend for an email to ${to}:`, error);
  }
}
