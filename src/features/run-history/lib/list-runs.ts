import { prisma } from "@/server/db/prisma";

import type { RunHistoryItem, RunHistoryStatusFilter } from "@/features/run-history/types";

const STATUS_FILTERS: RunHistoryStatusFilter[] = ["all", "queued", "processing", "completed", "failed"];

export function parseRunHistoryStatusFilter(value: string | undefined): RunHistoryStatusFilter {
  return STATUS_FILTERS.includes(value as RunHistoryStatusFilter)
    ? (value as RunHistoryStatusFilter)
    : "all";
}

export function normalizeRunHistorySearchQuery(value: string | undefined): string {
  if (!value) return "";
  return value.trim().slice(0, 100);
}

export async function listRunHistory(params: { status: RunHistoryStatusFilter; q: string }): Promise<RunHistoryItem[]> {
  const runs = await prisma.analysisRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    where: {
      ...(params.status !== "all" ? { status: params.status } : {}),
      ...(params.q ? { question: { contains: params.q } } : {}),
    },
    select: {
      id: true,
      question: true,
      status: true,
      lastErrorMessage: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { shareLinks: true } },
      answerSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          title: true,
          _count: { select: { sourceSnapshots: true, claims: true, alerts: true } },
        },
      },
    },
  });

  return runs.map((run) => {
    const latestAnswer = run.answerSnapshots[0] ?? null;
    return {
      id: run.id,
      researchTopic: run.question,
      status: run.status,
      lastErrorMessage: run.lastErrorMessage,
      answerTitle: latestAnswer?.title ?? null,
      sourceCount: latestAnswer?._count.sourceSnapshots ?? 0,
      claimCount: latestAnswer?._count.claims ?? 0,
      alertCount: latestAnswer?._count.alerts ?? 0,
      shareLinkCount: run._count.shareLinks,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
    } satisfies RunHistoryItem;
  });
}
