-- CreateTable
CREATE TABLE "score_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rounds" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "score_runs_created_at_idx" ON "score_runs"("created_at");

-- AddForeignKey
ALTER TABLE "score_runs" ADD CONSTRAINT "score_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
