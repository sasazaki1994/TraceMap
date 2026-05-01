-- CreateEnum
CREATE TYPE "CounterpointRelationKind" AS ENUM (
    'contradiction',
    'alternative_interpretation',
    'different_premise',
    'different_definition',
    'temporal_mismatch'
);

-- CreateEnum
CREATE TYPE "PropagationStepKind" AS ENUM (
    'source',
    'evidence_snippet',
    'source_interpretation',
    'claim',
    'answer_segment'
);

-- AlterTable
ALTER TABLE "counterpoints"
ADD COLUMN "relation_kind" "CounterpointRelationKind" NOT NULL DEFAULT 'contradiction',
ADD COLUMN "target_claim_id" TEXT,
ADD COLUMN "actionability_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lens_priority" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "claim_propagation_chains" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "step_index" INTEGER NOT NULL,
    "step_kind" "PropagationStepKind" NOT NULL,
    "summary" TEXT NOT NULL,
    "source_snapshot_id" TEXT,
    "quote_text" TEXT,
    "is_primary_boundary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_propagation_chains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counterpoints_target_claim_id_idx" ON "counterpoints"("target_claim_id");

-- CreateIndex
CREATE INDEX "claim_propagation_chains_claim_id_step_index_idx" ON "claim_propagation_chains"("claim_id", "step_index");

-- AddForeignKey
ALTER TABLE "counterpoints"
ADD CONSTRAINT "counterpoints_target_claim_id_fkey" FOREIGN KEY ("target_claim_id") REFERENCES "claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_propagation_chains"
ADD CONSTRAINT "claim_propagation_chains_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_propagation_chains"
ADD CONSTRAINT "claim_propagation_chains_source_snapshot_id_fkey" FOREIGN KEY ("source_snapshot_id") REFERENCES "source_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
