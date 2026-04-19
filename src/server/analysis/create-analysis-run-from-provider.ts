import type { Prisma } from "@prisma/client";

import { persistGeneratedAnswerGraph } from "@/server/analysis/persist-generated-answer-graph";
import { resolveAnswerGraphProvider } from "@/server/analysis/resolve-answer-graph-provider";
import { prisma } from "@/server/db/prisma";

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

  let result;
  try {
    result = await provider.generateAnswerGraph({ question });
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

  try {
    await persistGeneratedAnswerGraph({
      runId: run.id,
      payload: result.payload,
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

  return run.id;
}
