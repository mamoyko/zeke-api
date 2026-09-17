-- CreateTable
CREATE TABLE "play_reward_days" (
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "play_wins" INTEGER NOT NULL DEFAULT 0,
    "panic_wins" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "play_reward_days_pkey" PRIMARY KEY ("user_id","date")
);

-- AddForeignKey
ALTER TABLE "play_reward_days" ADD CONSTRAINT "play_reward_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
