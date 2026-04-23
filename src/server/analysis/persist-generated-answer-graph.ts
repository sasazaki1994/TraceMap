import type { Prisma } from "@prisma/client";

import type { GeneratedAnswerGraphPayload } from "@/types/answer-graph-generation";
import type { AnswerGraphJson } from "@/types/answer-graph";

import { computeClaimConfidence } from "@/server/analysis/claim-confidence";
import { prisma } from "@/server/db/prisma";
import { verifyPublicHttpUrl } from "@/server/analysis/verify-source-url";

function isPublicHttpUrlForVerification(raw: string | null): raw is string {
  if (raw === null) {
    return false;
  }
  const t = raw.trim();
  if (!t) {
    return false;
  }
  try {
    const u = new URL(t);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.length > 0;
  } catch {
    return false;
  }
}

function replaceGraphSourceIds(
  graph: AnswerGraphJson,
  idMap: Map<string, string>,
): AnswerGraphJson {
  const nextNodes = graph.nodes.map((n) => {
    if (n.kind !== "source" || !n.sourceSnapshotId) {
      return n;
    }
    const next = idMap.get(n.sourceSnapshotId);
    if (!next) {
      return n;
    }
    return { ...n, sourceSnapshotId: next };
  });
  return { ...graph, nodes: nextNodes } as AnswerGraphJson;
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

  const verificationByIndex = await Promise.all(
    payload.sources.map((src) =>
      isPublicHttpUrlForVerification(src.url)
        ? verifyPublicHttpUrl(src.url)
        : Promise.resolve({
            verificationStatus: "unverified" as const,
            checkedAt: null as Date | null,
            httpStatus: null as number | null,
            finalUrl: null as string | null,
            contentType: null as string | null,
          }),
    ),
  );

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
      const v = verificationByIndex[i];
      const row = await tx.sourceSnapshot.create({
        data: {
          analysisRunId: runId,
          answerSnapshotId: answer.id,
          label: src.label,
          sourceType: src.sourceType,
          url: src.url,
          excerpt: src.excerpt,
          publishedAt: src.publishedAt ?? null,
          verificationStatus: v.verificationStatus,
          checkedAt: v.checkedAt,
          httpStatus: v.httpStatus,
          finalUrl: v.finalUrl,
          contentType: v.contentType,
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

      for (let i = 0; i < e.claims.length; i++) {
        const c = e.claims[i];
        const claimRow = await tx.claim.create({
          data: {
            answerSnapshotId: answer.id,
            summary: c.summary,
            graphNodeId: c.graphNodeId,
          },
        });

        const supportRelations = c.supports
          ? c.supports.flatMap((support) => {
              const sourceSnapshotId = idMap.get(support.sourcePlaceholderId);
              if (!sourceSnapshotId) {
                return [];
              }
              return [
                {
                  sourceSnapshotId,
                  supportKind: support.supportKind,
                  isPrimarySource: support.isPrimarySource ?? false,
                  supportingQuote: support.supportingQuote ?? null,
                  contradictionNote: support.contradictionNote ?? null,
                },
              ];
            })
          : [
              ...new Set(
                c.supportedSourcePlaceholderIds
                  .map((ph) => idMap.get(ph))
                  .filter((x): x is string => x !== undefined),
              ),
            ].map((sourceSnapshotId) => ({
              sourceSnapshotId,
              supportKind: "direct" as const,
              isPrimarySource: false,
              supportingQuote: null,
              contradictionNote: null,
            }));

        if (supportRelations.length > 0) {
          await tx.claimSourceSnapshot.createMany({
            data: supportRelations.map((support) => ({
              claimId: claimRow.id,
              sourceSnapshotId: support.sourceSnapshotId,
              supportKind: support.supportKind,
              isPrimarySource: support.isPrimarySource,
              supportingQuote: support.supportingQuote,
              contradictionNote: support.contradictionNote,
            })),
            skipDuplicates: true,
          });
        }

        const linkedSources = supportRelations.flatMap((support) => {
          const source = payload.sources.find(
            (_, sourceIndex) => idMap.get(`__src_${sourceIndex}__`) === support.sourceSnapshotId,
          );
          if (!source) {
            return [];
          }
          return [
            {
              url: source.url,
              publishedAt: source.publishedAt ?? null,
              supportKind: support.supportKind,
              isPrimarySource: support.isPrimarySource,
              supportingQuote: support.supportingQuote,
              contradictionNote: support.contradictionNote,
            },
          ];
        });

        const confidence = computeClaimConfidence(linkedSources);
        await tx.claimConfidence.create({
          data: {
            claimId: claimRow.id,
            score: confidence.score,
            level: confidence.level,
            summary: confidence.summary,
            hasPrimarySource: confidence.hasPrimarySource,
            independentSourceCount: confidence.independentSourceCount,
            hasSupportingQuote: confidence.hasSupportingQuote,
            recencyStatus: confidence.recencyStatus,
            hasContradiction: confidence.hasContradiction,
          },
        });

        const counterpointsToWrite =
          c.counterpoints !== undefined && c.counterpoints.length > 0
            ? c.counterpoints
            : i === 0 && e.counterpoint
              ? [{ summary: e.counterpoint.summary }]
              : [];

        for (const cp of counterpointsToWrite) {
          await tx.counterpoint.create({
            data: {
              claimId: claimRow.id,
              summary: cp.summary,
              relationKind: cp.relationKind ?? "contradiction",
              graphNodeId: cp.graphNodeId ?? null,
              basedOnClaimId: null,
            },
          });
        }

        if (c.propagationChain) {
          const chainRow = await tx.claimPropagationChain.create({
            data: {
              claimId: claimRow.id,
              lensHint: null,
              summary: null,
            },
          });
          for (let chainIndex = 0; chainIndex < c.propagationChain.length; chainIndex += 1) {
            const step = c.propagationChain[chainIndex];
            const sourceSnapshotId =
              step.sourcePlaceholderId != null ? (idMap.get(step.sourcePlaceholderId) ?? null) : null;
            await tx.claimPropagationStep.create({
              data: {
                claimPropagationChainId: chainRow.id,
                ordinal: step.order,
                stepKind: step.stepKind,
                label: step.label,
                detail: step.detail ?? null,
                graphNodeId:
                  step.claimGraphNodeId ?? step.answerSegmentKey ?? null,
                sourceSnapshotId,
              },
            });
          }
        }

        if (c.alerts) {
          for (const al of c.alerts) {
            await tx.alert.create({
              data: {
                answerSnapshotId: answer.id,
                claimId: claimRow.id,
                level: al.level,
                message: al.message,
              },
            });
          }
        }

        if (supportRelations.length === 0) {
          await tx.alert.create({
            data: {
              answerSnapshotId: answer.id,
              claimId: claimRow.id,
              level: "error",
              message: "No supporting source is linked to this claim.",
            },
          });
        }
        if (!confidence.hasPrimarySource) {
          await tx.alert.create({
            data: {
              answerSnapshotId: answer.id,
              claimId: claimRow.id,
              level: "warning",
              message: "This claim has no primary source.",
            },
          });
        }
        if (supportRelations.length === 1) {
          await tx.alert.create({
            data: {
              answerSnapshotId: answer.id,
              claimId: claimRow.id,
              level: "warning",
              message: "This claim is supported by only one source.",
            },
          });
        }
        if (!confidence.hasSupportingQuote) {
          await tx.alert.create({
            data: {
              answerSnapshotId: answer.id,
              claimId: claimRow.id,
              level: "warning",
              message: "This claim does not include a supporting quote or cited passage.",
            },
          });
        }
        if (confidence.recencyStatus !== "current") {
          await tx.alert.create({
            data: {
              answerSnapshotId: answer.id,
              claimId: claimRow.id,
              level: "warning",
              message:
                confidence.recencyStatus === "stale"
                  ? "Supporting sources for this claim appear stale."
                  : "Supporting sources for this claim do not include a clear publication time.",
            },
          });
        }
        if (confidence.hasContradiction) {
          await tx.alert.create({
            data: {
              answerSnapshotId: answer.id,
              claimId: claimRow.id,
              level: "warning",
              message: "Supporting sources for this claim contain contradiction or counter-evidence.",
            },
          });
        }
      }

      if (e.alert) {
        await tx.alert.create({
          data: {
            answerSnapshotId: answer.id,
            claimId: null,
            level: e.alert.level,
            message: e.alert.message,
          },
        });
      }
    }
  });
}
