-- CreateTable
CREATE TABLE "run_cache_entries" (
    "id" TEXT NOT NULL,
    "cache_key" TEXT NOT NULL,
    "normalized_topic" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_model" TEXT,
    "prompt_version" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "limits_profile" TEXT NOT NULL,
    "mode" TEXT,
    "payload_json" JSONB NOT NULL,
    "source_url_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "hit_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "run_cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "run_cache_entries_cache_key_key" ON "run_cache_entries"("cache_key");

-- CreateIndex
CREATE INDEX "run_cache_entries_normalized_topic_idx" ON "run_cache_entries"("normalized_topic");

-- CreateIndex
CREATE INDEX "run_cache_entries_provider_id_idx" ON "run_cache_entries"("provider_id");

-- CreateIndex
CREATE INDEX "run_cache_entries_expires_at_idx" ON "run_cache_entries"("expires_at");
