// Test accounts for trying the app out — not sample "production" data. Reuses
// the same services the API itself uses (AuthSvc, BountySvc, DailyRepo)
// rather than writing to Prisma directly, so a seeded account is created
// exactly the way a real signup would be: same password hashing, same
// balance default, same validation.
//
// Safe to re-run — every step checks what's already there first, so running
// this against a database that already has these accounts just leaves them
// alone instead of erroring or duplicating.
import { prisma } from "../src/utils/prisma";
import AuthSvc from "../src/services/auth.service";
import BountySvc from "../src/services/bounty.service";
import UserRepo from "../src/repositories/user.repository";
import DailyRepo from "../src/repositories/daily.repository";
import { dayKey } from "../src/data/daily-words";

const PASSWORD = "password123";

const ACCOUNTS = [
  { name: "Test", email: "test@zeke.dev" },
  { name: "Alice", email: "alice@zeke.dev" },
  { name: "Bob", email: "bob@zeke.dev" },
];

async function ensureAccount(name: string, email: string): Promise<string> {
  const existing = await UserRepo.findByEmail(email);
  if (existing) {
    console.log(`  already exists: ${email}`);
    return existing.id;
  }
  const { user } = await AuthSvc.signup(name, email, PASSWORD);
  console.log(`  created: ${email}`);
  return user.id;
}

function daysAgo(n: number): string {
  return dayKey(new Date(Date.now() - n * 86_400_000));
}

async function main() {
  console.log("Seeding accounts (password for all of them: %s)...", PASSWORD);
  const [testId, aliceId, bobId] = await Promise.all(
    ACCOUNTS.map((a) => ensureAccount(a.name, a.email)),
  );

  // Give "test" a running Daily Challenge streak so DAILY isn't empty on
  // first look — 4 days, last one yesterday, so today's win would extend it.
  console.log("Seeding a Daily Challenge streak for test@zeke.dev...");
  const streak = await DailyRepo.findStreak(testId);
  if (streak.current === 0 && streak.longest === 0) {
    await DailyRepo.saveStreak({
      userId: testId,
      current: 4,
      longest: 4,
      lastCompletedDate: daysAgo(1),
    });
    console.log("  streak set to 4 (last win: yesterday)");
  } else {
    console.log("  already has streak data, left alone");
  }

  // One pending bounty waiting in test@zeke.dev's inbox, sent from Alice, so
  // BOUNTY isn't empty either.
  console.log("Seeding a pending bounty from alice to test@zeke.dev...");
  const alreadySent = await prisma.bounty.findFirst({
    where: { senderId: aliceId, recipientId: testId, status: "pending" },
  });
  if (!alreadySent) {
    const [{ word }] = BountySvc.wordOptions();
    await BountySvc.create(aliceId, "test@zeke.dev", word, 25);
    console.log(`  sent: "${word}" for 25 coins`);
  } else {
    console.log("  a pending bounty already exists, left alone");
  }

  console.log("\nDone. Sign in with any of:");
  for (const a of ACCOUNTS) {
    console.log(`  ${a.email} / ${PASSWORD}`);
  }
  void bobId; // seeded for symmetry (a second bounty partner) - not otherwise used yet.
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
