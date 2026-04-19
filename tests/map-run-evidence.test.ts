import { describe, expect, it } from "vitest";

import { mapAnswerEvidenceForView } from "@/server/analysis/map-run-evidence";

describe("mapAnswerEvidenceForView", () => {
  it("maps nested claims and alerts for the run view", () => {
    const { evidenceClaims, evidenceAlerts } = mapAnswerEvidenceForView({
      claims: [
        {
          id: "c1",
          summary: "Claim one",
          graphNodeId: "node_answer",
          claimSourceSnapshots: [{ sourceSnapshotId: "src-a" }],
          counterpoints: [{ id: "cp1", summary: "Counter one" }],
        },
      ],
      alerts: [
        { id: "a1", level: "warning", message: "Look out" },
      ],
    });

    expect(evidenceClaims).toHaveLength(1);
    expect(evidenceClaims[0]?.graphNodeId).toBe("node_answer");
    expect(evidenceClaims[0]?.supportingSourceIds).toEqual(["src-a"]);
    expect(evidenceClaims[0]?.counterpoints).toEqual([
      { id: "cp1", summary: "Counter one" },
    ]);
    expect(evidenceAlerts).toEqual([
      { id: "a1", level: "warning", message: "Look out" },
    ]);
  });
});
