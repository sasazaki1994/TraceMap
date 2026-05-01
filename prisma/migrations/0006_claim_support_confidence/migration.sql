-- CreateEnum
CREATE TYPE "ClaimSupportKind" AS ENUM ('direct', 'supplemental', 'indirect');

-- CreateEnum
CREATE TYPE "ClaimConfidenceLevel" AS ENUM ('high', 'medium', 'low', 'insufficient');

-- CreateEnum
CREATE TYPE "ClaimRecencyStatus" AS ENUM ('current', 'stale', 'unknown');

-- AlterTable
ALTER TABLE "source_snapshots"
ADD COLUMN "published_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "claim_source_snapshots"
ADD COLUMN "support_kind" "ClaimSupportKind" NOT NULL DEFAULT 'direct',
ADD COLUMN "is_primary_source" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supporting_quote" TEXT,
ADD COLUMN "contradiction_note" TEXT;

-- CreateTable
CREATE TABLE "claim_confidences" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" "ClaimConfidenceLevel" NOT NULL,
    "summary" TEXT NOT NULL,
    "has_primary_source" BOOLEAN NOT NULL DEFAULT false,
    "independent_source_count" INTEGER NOT NULL DEFAULT 0,
    "has_supporting_quote" BOOLEAN NOT NULL DEFAULT false,
    "recency_status" "ClaimRecencyStatus" NOT NULL DEFAULT 'unknown',
    "has_contradiction" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_confidences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claim_confidences_claim_id_key" ON "claim_confidences"("claim_id");

-- AddForeignKey
ALTER TABLE "claim_confidences" ADD CONSTRAINT "claim_confidences_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
