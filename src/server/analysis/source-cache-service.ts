import type { Prisma, SourceVerificationStatus } from "@prisma/client";

import {
  fetchSourceSnapshot,
  type FetchSourceSnapshotResult,
} from "@/server/analysis/fetch-source-snapshot";
import { prisma } from "@/server/db/prisma";
import {
  normalizeSourceUrl,
  type NormalizeSourceUrlResult,
} from "@/server/analysis/source-url-normalization";

export type ResolveSourceCacheResult =
  | {
      kind: "resolved";
      normalizedUrl: string;
      originalUrl: string;
      sourceCacheEntryId: string;
      sourceFetchSnapshotId: string | null;
      verificationStatus: SourceVerificationStatus;
      checkedAt: Date;
      httpStatus: number | null;
      finalUrl: string | null;
      contentType: string | null;
      contentHash: string | null;
      excerpt: string | null;
      reusedCache: boolean;
    }
  | {
      kind: "invalid";
      normalizedUrl: string | null;
      verificationStatus: "invalid";
      checkedAt: Date;
      errorMessage: string;
    };

type SourceCachePrismaClient = {
  sourceCacheEntry: Pick<
    typeof prisma.sourceCacheEntry,
    "findUnique" | "create" | "update"
  >;
  sourceFetchSnapshot: Pick<typeof prisma.sourceFetchSnapshot, "create">;
};

type ResolveSourceCacheOptions = {
  db?: SourceCachePrismaClient;
  now?: Date;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
  ttlHours?: number;
  normalize?: (rawUrl: string) => NormalizeSourceUrlResult;
  fetchSnapshot?: (
    url: string,
    options?: { fetchImpl?: typeof fetch; timeoutMs?: number; maxBytes?: number },
  ) => Promise<FetchSourceSnapshotResult>;
};

const DEFAULT_SOURCE_CACHE_TTL_HOURS = 24;

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getSourceCacheTtlHours(): number {
  return readPositiveIntEnv(
    "TRACEMAP_SOURCE_CACHE_TTL_HOURS",
    DEFAULT_SOURCE_CACHE_TTL_HOURS,
  );
}

function isFreshSuccessfulCacheEntry(
  entry: {
    latestFetchedAt: Date | null;
    latestErrorMessage: string | null;
    latestHttpStatus: number | null;
  },
  now: Date,
  ttlHours: number,
): boolean {
  if (entry.latestFetchedAt === null || entry.latestErrorMessage !== null) {
    return false;
  }
  if (entry.latestHttpStatus === null) {
    return false;
  }
  const ageMs = now.getTime() - entry.latestFetchedAt.getTime();
  return ageMs >= 0 && ageMs <= ttlHours * 60 * 60 * 1000;
}

function verificationStatusFromFetchResult(
  result: FetchSourceSnapshotResult,
): SourceVerificationStatus {
  switch (result.kind) {
    case "fetched":
      return "verified";
    case "failed":
      return "unreachable";
    case "blocked":
      return "invalid";
  }
}

function latestUpdateFromFetchResult(
  result: FetchSourceSnapshotResult,
  originalUrl: string,
): Prisma.SourceCacheEntryUpdateInput {
  const base = { originalUrl };
  switch (result.kind) {
    case "fetched":
      return {
        ...base,
        latestFinalUrl: result.finalUrl,
        latestHttpStatus: result.httpStatus,
        latestContentType: result.contentType,
        latestContentHash: result.contentHash,
        latestErrorMessage: null,
      };
    case "failed":
      return {
        ...base,
        latestFinalUrl: result.finalUrl ?? null,
        latestHttpStatus: result.httpStatus ?? null,
        latestContentType: result.contentType ?? null,
        latestContentHash: null,
        latestErrorMessage: result.errorMessage,
      };
    case "blocked":
      return {
        ...base,
        latestFinalUrl: null,
        latestHttpStatus: null,
        latestContentType: null,
        latestContentHash: null,
        latestErrorMessage: result.errorMessage,
      };
  }
}

function fetchSnapshotCreateData(params: {
  sourceCacheEntryId: string;
  result: FetchSourceSnapshotResult;
}): Prisma.SourceFetchSnapshotCreateInput {
  const { sourceCacheEntryId, result } = params;
  const sourceCacheEntry = { connect: { id: sourceCacheEntryId } };
  switch (result.kind) {
    case "fetched":
      return {
        sourceCacheEntry,
        requestedUrl: result.requestedUrl,
        finalUrl: result.finalUrl,
        httpStatus: result.httpStatus,
        contentType: result.contentType,
        contentHash: result.contentHash,
        excerpt: result.excerpt,
        errorMessage: null,
      };
    case "failed":
      return {
        sourceCacheEntry,
        requestedUrl: result.requestedUrl,
        finalUrl: result.finalUrl ?? null,
        httpStatus: result.httpStatus ?? null,
        contentType: result.contentType ?? null,
        contentHash: null,
        excerpt: null,
        errorMessage: result.errorMessage,
      };
    case "blocked":
      return {
        sourceCacheEntry,
        requestedUrl: result.requestedUrl,
        finalUrl: null,
        httpStatus: null,
        contentType: null,
        contentHash: null,
        excerpt: null,
        errorMessage: result.errorMessage,
      };
  }
}

/**
 * Resolves reusable source cache metadata for a provider-returned source URL.
 * This is best effort: failures are returned as verification metadata and do not throw.
 */
export async function resolveSourceCacheForUrl(
  rawUrl: string,
  options: ResolveSourceCacheOptions = {},
): Promise<ResolveSourceCacheResult> {
  const db = options.db ?? prisma;
  const checkedAt = options.now ?? new Date();
  const normalize = options.normalize ?? normalizeSourceUrl;
  const normalized = normalize(rawUrl);

  if (normalized.kind === "failure") {
    return {
      kind: "invalid",
      normalizedUrl: null,
      verificationStatus: "invalid",
      checkedAt,
      errorMessage: normalized.message,
    };
  }

  const ttlHours = options.ttlHours ?? getSourceCacheTtlHours();
  const existing = await db.sourceCacheEntry.findUnique({
    where: { normalizedUrl: normalized.normalizedUrl },
  });

  if (existing && isFreshSuccessfulCacheEntry(existing, checkedAt, ttlHours)) {
    return {
      kind: "resolved",
      normalizedUrl: normalized.normalizedUrl,
      originalUrl: normalized.originalUrl,
      sourceCacheEntryId: existing.id,
      sourceFetchSnapshotId: null,
      verificationStatus: "verified",
      checkedAt: existing.latestFetchedAt ?? checkedAt,
      httpStatus: existing.latestHttpStatus,
      finalUrl: existing.latestFinalUrl,
      contentType: existing.latestContentType,
      contentHash: existing.latestContentHash,
      excerpt: null,
      reusedCache: true,
    };
  }

  const entry =
    existing ??
    (await db.sourceCacheEntry.create({
      data: {
        normalizedUrl: normalized.normalizedUrl,
        originalUrl: normalized.originalUrl,
      },
    }));

  const fetchSnapshot = options.fetchSnapshot ?? fetchSourceSnapshot;
  const fetchResult = await fetchSnapshot(normalized.normalizedUrl, {
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    maxBytes: options.maxBytes,
  });
  const fetchedAt = checkedAt;
  const snapshot = await db.sourceFetchSnapshot.create({
    data: {
      ...fetchSnapshotCreateData({
        sourceCacheEntryId: entry.id,
        result: fetchResult,
      }),
      fetchedAt,
    },
  });

  await db.sourceCacheEntry.update({
    where: { id: entry.id },
    data: {
      ...latestUpdateFromFetchResult(fetchResult, normalized.originalUrl),
      latestFetchedAt: fetchedAt,
    },
  });

  switch (fetchResult.kind) {
    case "fetched":
      return {
        kind: "resolved",
        normalizedUrl: normalized.normalizedUrl,
        originalUrl: normalized.originalUrl,
        sourceCacheEntryId: entry.id,
        sourceFetchSnapshotId: snapshot.id,
        verificationStatus: verificationStatusFromFetchResult(fetchResult),
        checkedAt: fetchedAt,
        httpStatus: fetchResult.httpStatus,
        finalUrl: fetchResult.finalUrl,
        contentType: fetchResult.contentType,
        contentHash: fetchResult.contentHash,
        excerpt: fetchResult.excerpt,
        reusedCache: false,
      };
    case "failed":
      return {
        kind: "resolved",
        normalizedUrl: normalized.normalizedUrl,
        originalUrl: normalized.originalUrl,
        sourceCacheEntryId: entry.id,
        sourceFetchSnapshotId: snapshot.id,
        verificationStatus: verificationStatusFromFetchResult(fetchResult),
        checkedAt: fetchedAt,
        httpStatus: fetchResult.httpStatus ?? null,
        finalUrl: fetchResult.finalUrl ?? null,
        contentType: fetchResult.contentType ?? null,
        contentHash: null,
        excerpt: null,
        reusedCache: false,
      };
    case "blocked":
      return {
        kind: "resolved",
        normalizedUrl: normalized.normalizedUrl,
        originalUrl: normalized.originalUrl,
        sourceCacheEntryId: entry.id,
        sourceFetchSnapshotId: snapshot.id,
        verificationStatus: verificationStatusFromFetchResult(fetchResult),
        checkedAt: fetchedAt,
        httpStatus: null,
        finalUrl: null,
        contentType: null,
        contentHash: null,
        excerpt: null,
        reusedCache: false,
      };
  }
}

export const sourceCacheServiceTestUtils = {
  isFreshSuccessfulCacheEntry,
  sourceCacheTtlHours: getSourceCacheTtlHours,
} as const;
