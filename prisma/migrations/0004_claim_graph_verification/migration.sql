-- CreateEnum
CREATE TYPE "SourceVerificationStatus" AS ENUM ('verified', 'unverified', 'unreachable', 'invalid');

-- AlterTable
ALTER TABLE "source_snapshots" ADD COLUMN     "verification_status" "SourceVerificationStatus" NOT NULL DEFAULT 'unverified',
ADD COLUMN     "checked_at" TIMESTAMP(3),
ADD COLUMN     "http_status" INTEGER,
ADD COLUMN     "final_url" TEXT,
ADD COLUMN     "content_type" TEXT;

-- CreateTable
CREATE TABLE "claim_source_snapshots" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "source_snapshot_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_source_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claim_source_snapshots_claim_id_source_snapshot_id_key" ON "claim_source_snapshots"("claim_id", "source_snapshot_id");

-- CreateIndex
CREATE INDEX "claim_source_snapshots_source_snapshot_id_idx" ON "claim_source_snapshots"("source_snapshot_id");

-- AddForeignKey
ALTER TABLE "claim_source_snapshots" ADD CONSTRAINT "claim_source_snapshots_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_source_snapshots" ADD CONSTRAINT "claim_source_snapshots_source_snapshot_id_fkey" FOREIGN KEY ("source_snapshot_id") REFERENCES "source_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
