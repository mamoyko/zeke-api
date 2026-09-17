import type { Bounty } from "@prisma/client";

export type TBounty = Bounty;

/** What the sender sees in their "sent" list — never the recipient's guesses,
 * just the outcome once resolved. */
export interface TSentBounty {
  id: string;
  recipientName: string;
  recipientUsername: string;
  recipientEmail: string;
  category: string;
  wager: number;
  reward: number;
  status: "pending" | "won" | "lost";
  createdAt: string;
}

/** What the recipient sees in their inbox — the word is withheld until they
 * open it (see BountyCtrl.play), same as the daily word is only "not secret"
 * once you're the one asking to play it. */
export interface TIncomingBounty {
  id: string;
  senderName: string;
  senderUsername: string;
  category: string;
  wager: number;
  reward: number;
  status: "pending" | "won" | "lost";
  createdAt: string;
}

export interface TWalletBalance {
  balance: number;
}
