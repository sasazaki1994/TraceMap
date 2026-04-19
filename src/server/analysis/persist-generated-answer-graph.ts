import type { Prisma } from "@prisma/client";

import type { GeneratedAnswerGraphPayload } from "@/types/answer-graph-generation";
import type { AnswerGraphJson } from "@/types/answer-graph";

import { prisma } from "@/server/db/prisma";

function replaceGraphSourceIds(
  graph: AnswerGraphJson,
  idMap: Map<string, string>,
): AnswerGraphJson {
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      if (n.kind !== "source" || !n.sourceSnapshotId) {
        return n;
      }
      const next = idMap.get(n.sourceSnapshotId);
      if (!next) {
        return n;
      }
      return { ...n, sourceSnapshotId: next };
    }),
  };
}

/**
 * Writes a generated payload into `analysis_runs` + related tables inside one transaction.
 * Caller controls run lifecycle (status before/after, failure handling).
 */
export async function persistGeneratedAnswerGraph(params: {
  runId: string;
  payload: GeneratedAnswerGraphPayload;
}): Promise<void> {
  const { runId, payload } = params;

  await prisma.$transaction(async (tx) => {
    const answer = await tx.answerSnapshot.create({
      data: {
        analysisRunId: runId,
        title: payload.answer.title,
        model: payload.answer.model,
        content: payload.answer.content,
      },
    });

    const idMap = new Map<string, string>();

    for (let i = 0; i < payload.sources.length; i++) {
      const src = payload.sources[i];
      const placeholderId = `__src_${i}__`;
      const row = await tx.sourceSnapshot.create({
        data: {
          analysisRunId: runId,
          answerSnapshotId: answer.id,
          label: src.label,
          sourceType: src.sourceType,
          url: src.url,
          excerpt: src.excerpt,
        },
      });
      idMap.set(placeholderId, row.id);
    }

    const graph = replaceGraphSourceIds(payload.answer.graphJson, idMap);

    await tx.answerSnapshot.update({
      where: { id: answer.id },
      data: { graphJson: graph as Prisma.InputJsonValue },
    });

    if (payload.evidence) {
      const e = payload.evidence;
      const claim = await tx.claim.create({
        data: {
          answerSnapshotId: answer.id,
          summary: e.claim.summary,
          graphNodeId: e.claim.graphNodeId,
        },
      });

      await tx.counterpoint.create({
        data: {
          claimId: claim.id,
          summary: e.counterpoint.summary,
        },
      });

      await tx.alert.create({
        data: {
          answerSnapshotId: answer.id,
          level: e.alert.level,
          message: e.alert.message,
        },
      });
    }
  });
}
