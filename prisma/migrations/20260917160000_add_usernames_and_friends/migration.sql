-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Backfill: slug of the display name plus a slice of the id so existing
-- rows cannot collide, even if two people signed up as "Joel".
UPDATE "users"
SET "username" = CASE
  WHEN length(lower(regexp_replace(coalesce("name", ''), '[^a-zA-Z0-9]', '', 'g'))) >= 3
    THEN left(lower(regexp_replace("name", '[^a-zA-Z0-9]', '', 'g')), 12)
         || left(replace("id", '-', ''), 6)
  ELSE 'zeke' || left(replace("id", '-', ''), 6)
END
WHERE "username" IS NULL;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "friend_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "friendships_user_id_friend_id_key" ON "friendships"("user_id", "friend_id");

ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
