-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('info', 'warning', 'error');

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "answer_snapshot_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "graph_node_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counterpoints" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counterpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "answer_snapshot_id" TEXT NOT NULL,
    "level" "AlertLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "claims_answer_snapshot_id_idx" ON "claims"("answer_snapshot_id");

-- CreateIndex
CREATE INDEX "counterpoints_claim_id_idx" ON "counterpoints"("claim_id");

-- CreateIndex
CREATE INDEX "alerts_answer_snapshot_id_idx" ON "alerts"("answer_snapshot_id");

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_answer_snapshot_id_fkey" FOREIGN KEY ("answer_snapshot_id") REFERENCES "answer_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "counterpoints" ADD CONSTRAINT "counterpoints_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "alerts" ADD CONSTRAINT "alerts_answer_snapshot_id_fkey" FOREIGN KEY ("answer_snapshot_id") REFERENCES "answer_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
