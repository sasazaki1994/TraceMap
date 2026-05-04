import type { Prisma } from "@prisma/client";

import { parseRunCachePayload } from "@/server/analysis/parse-run-cache-payload";
import type { BuildRunCacheKeyResult } from "@/server/analysis/run-cache-key";
import { prisma } from "@/server/db/prisma";
import type { GeneratedAnswerGraphPayload } from "@/types/answer-graph-generation";

const DEFAULT_RUN_CACHE_TTL_HOURS = 24;

type RunCachePrismaClient = {
  runCacheEntry: Pick<
    typeof prisma.runCacheEntry,
    "findUnique" | "update" | "upsert"
  >;
};

export type RunCacheLookupResult =
  | {
      kind: "hit";
      entryId: string;
      payload: GeneratedAnswerGraphPayload;
      cacheKey: string;
    }
  | {
      kind: "miss";
      cacheKey: string;
      reason: "not_found" | "stale" | "invalid_payload";
    };

export type StoreRunCacheInput = {
  cacheKeyInfo: BuildRunCacheKeyResult;
  payload: GeneratedAnswerGraphPayload;
  ttlHours?: number;
};

type RunCacheOptions = {
  db?: RunCachePrismaClient;
  now?: Date;
};

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getRunCacheTtlHours(): number {
  return readPositiveIntEnv(
    "TRACEMAP_RUN_CACHE_TTL_HOURS",
    DEFAULT_RUN_CACHE_TTL_HOURS,
  );
}

function resolveTtlHours(ttlHours?: number): number {
  return Number.isFinite(ttlHours) && ttlHours !== undefined && ttlHours > 0
    ? ttlHours
    : getRunCacheTtlHours();
}

function expiresAtFrom(now: Date, ttlHours: number): Date {
  return new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
}

function toJsonInput(payload: GeneratedAnswerGraphPayload): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
}

export async function lookupRunCacheEntry(
  cacheKeyInfo: BuildRunCacheKeyResult,
  options: RunCacheOptions = {},
): Promise<RunCacheLookupResult> {
  const db = options.db ?? prisma;
  const now = options.now ?? new Date();
  const entry = await db.runCacheEntry.findUnique({
    where: { cacheKey: cacheKeyInfo.cacheKey },
  });

  if (!entry) {
    return {
      kind: "miss",
      cacheKey: cacheKeyInfo.cacheKey,
      reason: "not_found",
    };
  }

  if (entry.expiresAt.getTime() <= now.getTime()) {
    return {
      kind: "miss",
      cacheKey: cacheKeyInfo.cacheKey,
      reason: "stale",
    };
  }

  const parsed = parseRunCachePayload(entry.payloadJson);
  if (parsed.kind === "failure") {
    return {
      kind: "miss",
      cacheKey: cacheKeyInfo.cacheKey,
      reason: "invalid_payload",
    };
  }

  await db.runCacheEntry.update({
    where: { id: entry.id },
    data: {
      hitCount: { increment: 1 },
      lastUsedAt: now,
    },
  });

  return {
    kind: "hit",
    entryId: entry.id,
    payload: parsed.payload,
    cacheKey: cacheKeyInfo.cacheKey,
  };
}

export async function storeRunCacheEntry(
  input: StoreRunCacheInput,
  options: RunCacheOptions = {},
): Promise<void> {
  const db = options.db ?? prisma;
  const now = options.now ?? new Date();
  const ttlHours = resolveTtlHours(input.ttlHours);
  const expiresAt = expiresAtFrom(now, ttlHours);
  const payloadJson = toJsonInput(input.payload);
  const parsed = parseRunCachePayload(payloadJson);

  if (parsed.kind === "failure") {
    throw new Error(`Run cache payload is invalid: ${parsed.errorMessage}`);
  }

  await db.runCacheEntry.upsert({
    where: { cacheKey: input.cacheKeyInfo.cacheKey },
    create: {
      cacheKey: input.cacheKeyInfo.cacheKey,
      normalizedTopic: input.cacheKeyInfo.normalizedTopic,
      providerId: input.cacheKeyInfo.providerId,
      providerModel: input.cacheKeyInfo.providerModel,
      promptVersion: input.cacheKeyInfo.promptVersion,
      schemaVersion: input.cacheKeyInfo.schemaVersion,
      limitsProfile: input.cacheKeyInfo.limitsProfile,
      mode: input.cacheKeyInfo.mode,
      payloadJson: payloadJson as Prisma.InputJsonValue,
      sourceUrlHash: null,
      expiresAt,
      lastUsedAt: null,
      hitCount: 0,
    },
    update: {
      normalizedTopic: input.cacheKeyInfo.normalizedTopic,
      providerId: input.cacheKeyInfo.providerId,
      providerModel: input.cacheKeyInfo.providerModel,
      promptVersion: input.cacheKeyInfo.promptVersion,
      schemaVersion: input.cacheKeyInfo.schemaVersion,
      limitsProfile: input.cacheKeyInfo.limitsProfile,
      mode: input.cacheKeyInfo.mode,
      payloadJson: payloadJson as Prisma.InputJsonValue,
      sourceUrlHash: null,
      expiresAt,
    },
  });
}

export const runCacheServiceTestUtils = {
  getRunCacheTtlHours,
  expiresAtFrom,
} as const;
