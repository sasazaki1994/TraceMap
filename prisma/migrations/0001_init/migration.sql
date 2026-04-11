-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AnalysisRunStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "SourceSnapshotType" AS ENUM ('web', 'document', 'note');

-- CreateTable
CREATE TABLE "analysis_runs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" "AnalysisRunStatus" NOT NULL DEFAULT 'queued',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_snapshots" (
    "id" TEXT NOT NULL,
    "analysis_run_id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_snapshots" (
    "id" TEXT NOT NULL,
    "analysis_run_id" TEXT NOT NULL,
    "answer_snapshot_id" TEXT,
    "label" TEXT NOT NULL,
    "source_type" "SourceSnapshotType" NOT NULL DEFAULT 'web',
    "url" TEXT,
    "excerpt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "analysis_run_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "answer_snapshots_analysis_run_id_idx" ON "answer_snapshots"("analysis_run_id");

-- CreateIndex
CREATE INDEX "source_snapshots_analysis_run_id_idx" ON "source_snapshots"("analysis_run_id");

-- CreateIndex
CREATE INDEX "source_snapshots_answer_snapshot_id_idx" ON "source_snapshots"("answer_snapshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_analysis_run_id_idx" ON "share_links"("analysis_run_id");

-- AddForeignKey
ALTER TABLE "answer_snapshots" ADD CONSTRAINT "answer_snapshots_analysis_run_id_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_snapshots" ADD CONSTRAINT "source_snapshots_analysis_run_id_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_snapshots" ADD CONSTRAINT "source_snapshots_answer_snapshot_id_fkey" FOREIGN KEY ("answer_snapshot_id") REFERENCES "answer_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_analysis_run_id_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
