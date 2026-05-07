import type { Prisma } from "@prisma/client";

import { persistGeneratedAnswerGraph } from "@/server/analysis/persist-generated-answer-graph";
import type { SourceIntakeResult } from "@/types/source-intake";
import { buildSourceIntakeFromQuestion } from "@/server/analysis/source-intake/source-intake-service";
import { resolveAnswerGraphProvider } from "@/server/analysis/resolve-answer-graph-provider";
import { buildRunCacheKey } from "@/server/analysis/run-cache-key";
import {
  lookupRunCacheEntry,
  storeRunCacheEntry,
} from "@/server/analysis/run-cache-service";
import { prisma } from "@/server/db/prisma";
import type { GeneratedAnswerGraphPayload } from "@/types/answer-graph-generation";

/**
 * Creates an `analysis_runs` row and fills evidence via the configured answer-graph provider.
 * Synchronous path: queued → processing → completed | failed (no background jobs).
 */
export async function createAnalysisRunFromProvider(question: string): Promise<string> {
  const provider = resolveAnswerGraphProvider();

  const run = await prisma.analysisRun.create({
    data: {
      question,
      status: "queued",
    },
  });

  await prisma.analysisRun.update({
    where: { id: run.id },
    data: { status: "processing" },
  });

  const cacheKeyInfo = buildRunCacheKey({
    researchTopic: question,
    providerId: provider.id,
    providerModel: provider.modelLabel ?? null,
  });

  let payload: GeneratedAnswerGraphPayload | null = null;
  let shouldStoreRunCache = false;

  try {
    const cached = await lookupRunCacheEntry(cacheKeyInfo);
    if (cached.kind === "hit") {
      console.info("[analysis] run cache hit", {
        runId: run.id,
        cacheKey: cached.cacheKey,
        entryId: cached.entryId,
      });
      payload = cached.payload;
    } else {
      console.info("[analysis] run cache miss", {
        runId: run.id,
        cacheKey: cached.cacheKey,
        reason: cached.reason,
      });
    }
  } catch (cause) {
    console.error("[analysis] run cache lookup failed", {
      runId: run.id,
      cause,
    });
  }

  if (payload === null) {
    let sourceIntake: SourceIntakeResult = { candidates: [], ignoredUrls: [] };
    try {
      sourceIntake = await buildSourceIntakeFromQuestion(question);
    } catch (cause) {
      console.error("[analysis] source intake failed", { runId: run.id, cause });
    }
    let result;
    try {
      result = await provider.generateAnswerGraph({ question, sourceCandidates: sourceIntake.candidates });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Answer graph generation failed.";
      console.error("[analysis] generateAnswerGraph threw", { runId: run.id, cause });
      await prisma.analysisRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          lastErrorMessage: message,
        } satisfies Prisma.AnalysisRunUpdateInput,
      });
      return run.id;
    }

    if (result.kind === "failure") {
      if (result.cause !== undefined) {
        console.error("[analysis] generateAnswerGraph failed", {
          runId: run.id,
          message: result.errorMessage,
          cause: result.cause,
        });
      }
      await prisma.analysisRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          lastErrorMessage: result.errorMessage,
        } satisfies Prisma.AnalysisRunUpdateInput,
      });
      return run.id;
    }

    payload = result.payload;
    shouldStoreRunCache = true;
  }

  try {
    await persistGeneratedAnswerGraph({
      runId: run.id,
      payload,
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Failed to persist answer graph.";
    console.error("[analysis] persistGeneratedAnswerGraph failed", {
      runId: run.id,
      cause,
    });
    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        lastErrorMessage: message,
      } satisfies Prisma.AnalysisRunUpdateInput,
    });
    return run.id;
  }

  await prisma.analysisRun.update({
    where: { id: run.id },
    data: {
      status: "completed",
      lastErrorMessage: null,
    } satisfies Prisma.AnalysisRunUpdateInput,
  });

  if (shouldStoreRunCache) {
    try {
      await storeRunCacheEntry({ cacheKeyInfo, payload });
      console.info("[analysis] run cache stored", {
        runId: run.id,
        cacheKey: cacheKeyInfo.cacheKey,
      });
    } catch (cause) {
      console.error("[analysis] run cache store failed", {
        runId: run.id,
        cacheKey: cacheKeyInfo.cacheKey,
        cause,
      });
    }
  }

  return run.id;
}
