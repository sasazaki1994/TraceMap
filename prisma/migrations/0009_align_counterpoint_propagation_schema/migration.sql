-- Align persisted evidence lineage tables with the current Prisma schema.
-- Earlier migrations created an older in-row propagation-chain shape; the
-- application now stores chain metadata separately from ordered step rows.

-- DropForeignKey
ALTER TABLE "claim_propagation_chains" DROP CONSTRAINT "claim_propagation_chains_source_snapshot_id_fkey";

-- DropForeignKey
ALTER TABLE "counterpoints" DROP CONSTRAINT "counterpoints_target_claim_id_fkey";

-- DropIndex
DROP INDEX "claim_propagation_chains_claim_id_step_index_idx";

-- DropIndex
DROP INDEX "counterpoints_target_claim_id_idx";

-- CreateTable
CREATE TABLE "claim_propagation_steps" (
    "id" TEXT NOT NULL,
    "claim_propagation_chain_id" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "step_kind" "PropagationStepKind" NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "source_snapshot_id" TEXT,
    "graph_node_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_propagation_steps_pkey" PRIMARY KEY ("id")
);

-- Preserve any rows written with the older in-row chain shape as one-step chains.
INSERT INTO "claim_propagation_steps" (
    "id",
    "claim_propagation_chain_id",
    "ordinal",
    "step_kind",
    "label",
    "detail",
    "source_snapshot_id",
    "graph_node_id",
    "created_at"
)
SELECT
    concat("id", '_step'),
    "id",
    "step_index",
    "step_kind",
    "summary",
    COALESCE("quote_text", "summary"),
    "source_snapshot_id",
    NULL,
    "created_at"
FROM "claim_propagation_chains";

-- AlterTable
ALTER TABLE "claim_propagation_chains"
DROP COLUMN "is_primary_boundary",
DROP COLUMN "quote_text",
DROP COLUMN "source_snapshot_id",
DROP COLUMN "step_index",
DROP COLUMN "step_kind",
ADD COLUMN "lens_hint" TEXT,
ALTER COLUMN "summary" DROP NOT NULL;

-- AlterTable
ALTER TABLE "counterpoints"
DROP COLUMN "actionability_score",
DROP COLUMN "lens_priority",
DROP COLUMN "target_claim_id",
ADD COLUMN "graph_node_id" TEXT;

-- CreateIndex
CREATE INDEX "claim_propagation_steps_claim_propagation_chain_id_ordinal_idx" ON "claim_propagation_steps"("claim_propagation_chain_id", "ordinal");

-- CreateIndex
CREATE INDEX "claim_propagation_steps_source_snapshot_id_idx" ON "claim_propagation_steps"("source_snapshot_id");

-- CreateIndex
CREATE INDEX "claim_propagation_chains_claim_id_idx" ON "claim_propagation_chains"("claim_id");

-- AddForeignKey
ALTER TABLE "claim_propagation_steps" ADD CONSTRAINT "claim_propagation_steps_claim_propagation_chain_id_fkey" FOREIGN KEY ("claim_propagation_chain_id") REFERENCES "claim_propagation_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_propagation_steps" ADD CONSTRAINT "claim_propagation_steps_source_snapshot_id_fkey" FOREIGN KEY ("source_snapshot_id") REFERENCES "source_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
