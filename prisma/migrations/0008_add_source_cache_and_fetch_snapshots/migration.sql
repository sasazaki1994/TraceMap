-- CreateTable
CREATE TABLE "source_cache_entries" (
    "id" TEXT NOT NULL,
    "normalized_url" TEXT NOT NULL,
    "original_url" TEXT,
    "latest_final_url" TEXT,
    "latest_http_status" INTEGER,
    "latest_content_type" TEXT,
    "latest_content_hash" TEXT,
    "latest_fetched_at" TIMESTAMP(3),
    "latest_error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_fetch_snapshots" (
    "id" TEXT NOT NULL,
    "source_cache_entry_id" TEXT NOT NULL,
    "requested_url" TEXT NOT NULL,
    "final_url" TEXT,
    "http_status" INTEGER,
    "content_type" TEXT,
    "content_hash" TEXT,
    "excerpt" TEXT,
    "error_message" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_fetch_snapshots_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "source_snapshots"
ADD COLUMN "source_cache_entry_id" TEXT,
ADD COLUMN "source_fetch_snapshot_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "source_cache_entries_normalized_url_key" ON "source_cache_entries"("normalized_url");

-- CreateIndex
CREATE INDEX "source_fetch_snapshots_source_cache_entry_id_idx" ON "source_fetch_snapshots"("source_cache_entry_id");

-- CreateIndex
CREATE INDEX "source_fetch_snapshots_fetched_at_idx" ON "source_fetch_snapshots"("fetched_at");

-- CreateIndex
CREATE INDEX "source_snapshots_source_cache_entry_id_idx" ON "source_snapshots"("source_cache_entry_id");

-- CreateIndex
CREATE INDEX "source_snapshots_source_fetch_snapshot_id_idx" ON "source_snapshots"("source_fetch_snapshot_id");

-- AddForeignKey
ALTER TABLE "source_fetch_snapshots" ADD CONSTRAINT "source_fetch_snapshots_source_cache_entry_id_fkey" FOREIGN KEY ("source_cache_entry_id") REFERENCES "source_cache_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_snapshots" ADD CONSTRAINT "source_snapshots_source_cache_entry_id_fkey" FOREIGN KEY ("source_cache_entry_id") REFERENCES "source_cache_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_snapshots" ADD CONSTRAINT "source_snapshots_source_fetch_snapshot_id_fkey" FOREIGN KEY ("source_fetch_snapshot_id") REFERENCES "source_fetch_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
