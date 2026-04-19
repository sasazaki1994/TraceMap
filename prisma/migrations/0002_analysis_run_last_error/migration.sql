-- Persist last failure message for failed runs (AI boundary / sync pipeline).
ALTER TABLE "analysis_runs" ADD COLUMN "last_error_message" TEXT;
