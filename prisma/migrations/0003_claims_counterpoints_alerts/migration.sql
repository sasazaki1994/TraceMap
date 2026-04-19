-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('info', 'low', 'medium', 'high');

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "analysis_run_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counterpoints" (
    "id" TEXT NOT NULL,
    "analysis_run_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counterpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "analysis_run_id" TEXT NOT NULL,
    "level" "AlertLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "claims_analysis_run_id_idx" ON "claims"("analysis_run_id");

-- CreateIndex
CREATE INDEX "counterpoints_analysis_run_id_idx" ON "counterpoints"("analysis_run_id");

-- CreateIndex
CREATE INDEX "alerts_analysis_run_id_idx" ON "alerts"("analysis_run_id");

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_analysis_run_id_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counterpoints" ADD CONSTRAINT "counterpoints_analysis_run_id_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_analysis_run_id_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
