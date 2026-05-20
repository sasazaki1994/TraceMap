import type { Prisma } from "@prisma/client";

import { persistGeneratedAnswerGraph } from "@/server/analysis/persist-generated-answer-graph";
import type { SourceIntakeResult } from "@/types/source-intake";
import { buildSourceIntakeFromQuestion } from "@/server/analysis/source-intake/source-intake-service";
import { resolveAnswerGraphProvider } from "@/server/analysis/resolve-answer-graph-provider";
import { resolveInvestigationMode } from "@/server/analysis/investigation-limits";
import { buildRunCacheKey } from "@/server/analysis/run-cache-key";
import {
  lookupRunCacheEntry,
  storeRunCacheEntry,
} from "@/server/analysis/run-cache-service";
import { prisma } from "@/server/db/prisma";
import type { GeneratedAnswerGraphPayload } from "@/types/answer-graph-generation";
import type { InvestigationMode } from "@/server/analysis/investigation-limits";

export type CreateAnalysisRunOptions = {
  mode?: InvestigationMode;
  manualSourceUrls?: string[];
  ownerId?: string;
};

const SAFE_RUN_FAILURE_MESSAGE =
  "調査結果を生成できませんでした。時間をおいて再実行してください。問題が続く場合は設定を確認してください。";

/**
 * Creates an `analysis_runs` row and fills evidence via the configured answer-graph provider.
 * Synchronous path: queued → processing → completed | failed (no background jobs).
 */
export async function createAnalysisRunFromProvider(
  question: string,
  options: CreateAnalysisRunOptions = {},
): Promise<string> {
  const provider = resolveAnswerGraphProvider();
  const mode = resolveInvestigationMode(
    options.mode ?? process.env.TRACEMAP_INVESTIGATION_MODE?.trim(),
  );

  // 手動URL指定時はユーザーが明示した調査条件を優先し、
  // 既存run cacheの再利用で入力意図が薄まることを避ける。
  const hasManualSourceUrls = (options.manualSourceUrls?.length ?? 0) > 0;

  const run = await prisma.analysisRun.create({
    data: {
      question,
      ownerId: options.ownerId ?? null,
      status: "queued",
    },
  });

  // MVP v2 は同期実行のため、run status は queued -> processing -> completed/failed を
  // この関数内で完結させる。
  await prisma.analysisRun.update({
    where: { id: run.id },
    data: { status: "processing" },
  });

  const cacheKeyInfo = buildRunCacheKey({
    researchTopic: question,
    providerId: provider.id,
    providerModel: provider.modelLabel ?? null,
    mode,
  });

  let payload: GeneratedAnswerGraphPayload | null = null;
  let shouldStoreRunCache = false;

  // run cacheは「同一topic + provider + mode」でのみ再利用する。
  // 手動URL付きrunは上書き条件なのでlookup自体を行わない。
  if (!hasManualSourceUrls) {
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
  }

  if (payload === null) {
    let sourceIntake: SourceIntakeResult = { candidates: [], ignoredUrls: [] };
    try {
      sourceIntake = await buildSourceIntakeFromQuestion(question, {
        manualSourceUrls: options.manualSourceUrls ?? [],
      });
    } catch (cause) {
      console.error("[analysis] source intake failed", { runId: run.id, cause });
    }
    let result;
    try {
      result = await provider.generateAnswerGraph({ question, sourceCandidates: sourceIntake.candidates, mode });
    } catch (cause) {
      console.error("[analysis] generateAnswerGraph threw", { runId: run.id, cause });
      // provider例外は生メッセージをUIへ出さず、安全な固定文言へ変換して保存する。
      await prisma.analysisRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          lastErrorMessage: SAFE_RUN_FAILURE_MESSAGE,
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
    console.error("[analysis] persistGeneratedAnswerGraph failed", {
      runId: run.id,
      cause,
    });
    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        lastErrorMessage: SAFE_RUN_FAILURE_MESSAGE,
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

  if (shouldStoreRunCache && !hasManualSourceUrls) {
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
