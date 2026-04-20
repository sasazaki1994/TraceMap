-- AlterTable
ALTER TABLE "alerts" ADD COLUMN "claim_id" TEXT;

-- CreateIndex
CREATE INDEX "alerts_claim_id_idx" ON "alerts"("claim_id");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
