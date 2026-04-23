import { describe, expect, it } from "vitest";

import { mapAnswerEvidenceForView } from "@/server/analysis/map-run-evidence";

describe("mapAnswerEvidenceForView", () => {
  it("maps claims, counterpoints, chains, and lens-aware data for the run view", () => {
    const { evidenceClaims, evidenceAlerts } = mapAnswerEvidenceForView({
      claims: [
        {
          id: "c1",
          summary: "Claim one",
          graphNodeId: "node_answer",
          claimSourceSnapshots: [
            {
              sourceSnapshotId: "src-a",
              supportKind: "direct",
              isPrimarySource: true,
              supportingQuote: "Quoted line",
              contradictionNote: null,
              sourceSnapshot: {
                label: "Source A",
              },
            },
          ],
          confidence: {
            score: 80,
            level: "high",
            summary: "Strong support",
            hasPrimarySource: true,
            independentSourceCount: 2,
            hasSupportingQuote: true,
            recencyStatus: "current",
            hasContradiction: false,
          },
          counterpoints: [
            {
              id: "cp1",
              summary: "Counter one",
              relationKind: "contradiction",
              graphNodeId: "node_counter_1",
            },
          ],
          propagationChain: [
            {
              id: "chain-1",
              summary: "Source to answer chain",
              steps: [
                {
                  id: "chain-step-1",
                  orderIndex: 0,
                  stepKind: "source",
                  label: "Source",
                  content: "Original source",
                  sourceId: "src-a",
                  boundary: "primary",
                },
                {
                  id: "chain-step-2",
                  orderIndex: 1,
                  stepKind: "answer_segment",
                  label: "Answer segment",
                  content: "Answer phrasing",
                  sourceId: null,
                  boundary: "interpretation",
                },
              ],
            },
          ],
        },
      ],
      alerts: [
        { id: "a1", claimId: "c1", level: "info", message: "Claim note" },
        { id: "a2", claimId: null, level: "warning", message: "Look out" },
      ],
    });

    expect(evidenceClaims).toHaveLength(1);
    expect(evidenceClaims[0]?.graphNodeId).toBe("node_answer");
    expect(evidenceClaims[0]?.supportingSourceIds).toEqual(["src-a"]);
    expect(evidenceClaims[0]?.supports).toEqual([
      {
        sourceId: "src-a",
        sourceLabel: "Source A",
        supportKind: "direct",
        isPrimarySource: true,
        supportingQuote: "Quoted line",
        contradictionNote: null,
      },
    ]);
    expect(evidenceClaims[0]?.confidence).toEqual({
      score: 80,
      level: "high",
      summary: "Strong support",
      hasPrimarySource: true,
      independentSourceCount: 2,
      hasSupportingQuote: true,
      recencyStatus: "current",
      hasContradiction: false,
    });
    expect(evidenceClaims[0]?.counterpoints).toEqual([
      expect.objectContaining({
        id: "cp1",
        summary: "Counter one",
        relationKind: "contradiction",
      }),
    ]);
    expect(evidenceClaims[0]?.propagationSteps).toEqual([
      expect.objectContaining({
        id: "chain-step-1",
        stepKind: "source",
        sourceId: "src-a",
      }),
      expect.objectContaining({
        id: "chain-step-2",
        stepKind: "answer_segment",
        sourceId: null,
      }),
    ]);
    expect(evidenceClaims[0]?.alerts).toEqual([
      { id: "a1", level: "info", message: "Claim note" },
    ]);
    expect(evidenceAlerts).toEqual([
      { id: "a2", level: "warning", message: "Look out" },
    ]);
  });
});
