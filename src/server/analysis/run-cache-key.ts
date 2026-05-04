import { createHash } from "node:crypto";

export const RUN_CACHE_PROMPT_VERSION = "investigation-v1";
export const RUN_CACHE_SCHEMA_VERSION = "answer-graph-v3";
export const RUN_CACHE_LIMITS_PROFILE = "mvp-v1";

export type BuildRunCacheKeyInput = {
  researchTopic: string;
  providerId: string;
  providerModel?: string | null;
  promptVersion?: string;
  schemaVersion?: string;
  limitsProfile?: string;
  mode?: string | null;
};

export type BuildRunCacheKeyResult = {
  cacheKey: string;
  normalizedTopic: string;
  providerId: string;
  providerModel: string | null;
  promptVersion: string;
  schemaVersion: string;
  limitsProfile: string;
  mode: string | null;
};

export function normalizeRunCacheTopic(researchTopic: string): string {
  return researchTopic.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildRunCacheKey(
  input: BuildRunCacheKeyInput,
): BuildRunCacheKeyResult {
  const normalizedTopic = normalizeRunCacheTopic(input.researchTopic);
  const providerId = input.providerId.trim().toLowerCase();
  const providerModel = normalizeOptional(input.providerModel);
  const promptVersion =
    normalizeOptional(input.promptVersion) ?? RUN_CACHE_PROMPT_VERSION;
  const schemaVersion =
    normalizeOptional(input.schemaVersion) ?? RUN_CACHE_SCHEMA_VERSION;
  const limitsProfile =
    normalizeOptional(input.limitsProfile) ?? RUN_CACHE_LIMITS_PROFILE;
  const mode = normalizeOptional(input.mode);

  const keyPayload = {
    normalizedTopic,
    providerId,
    providerModel,
    promptVersion,
    schemaVersion,
    limitsProfile,
    mode,
  };
  const cacheKey = createHash("sha256")
    .update(JSON.stringify(keyPayload))
    .digest("hex");

  return {
    cacheKey,
    normalizedTopic,
    providerId,
    providerModel,
    promptVersion,
    schemaVersion,
    limitsProfile,
    mode,
  };
}
