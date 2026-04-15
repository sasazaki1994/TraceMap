import { describe, expect, it } from "vitest";

import {
  answerGraphJsonSchema,
  parseAnswerGraphJson,
} from "@/types/answer-graph";

describe("answerGraphJsonSchema", () => {
  it("accepts a valid v1 graph with claims and alerts", () => {
    const value = {
      version: 1 as const,
      nodes: [
        { id: "n1", kind: "question" as const, label: "Q?" },
        { id: "n2", kind: "answer" as const, label: "A" },
        {
          id: "n3",
          kind: "source" as const,
          label: "S",
          sourceSnapshotId: "clxyz",
        },
      ],
      edges: [{ id: "e1", from: "n1", to: "n2" }],
      claims: [
        {
          id: "c1",
          text: "Test claim",
          weight: 0.8,
          missingEvidence: false,
          sourceNodeIds: ["n3"],
        },
      ],
      alerts: [
        {
          id: "a1",
          level: "warning" as const,
          message: "Potential gap",
          weight: 0.6,
          claimId: "c1",
          missingEvidence: true,
        },
      ],
    };
    expect(answerGraphJsonSchema.safeParse(value).success).toBe(true);
  });

  it("fills default claims/alerts arrays when missing", () => {
    const parsed = answerGraphJsonSchema.parse({
      version: 1,
      nodes: [],
      edges: [],
    });
    expect(parsed.claims).toEqual([]);
    expect(parsed.alerts).toEqual([]);
  });

  it("rejects wrong version", () => {
    const result = answerGraphJsonSchema.safeParse({
      version: 2,
      nodes: [],
      edges: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects claim weight outside range", () => {
    const result = answerGraphJsonSchema.safeParse({
      version: 1,
      nodes: [],
      edges: [],
      claims: [
        {
          id: "c1",
          text: "bad",
          weight: 1.4,
          missingEvidence: false,
          sourceNodeIds: [],
        },
      ],
      alerts: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid alert level", () => {
    const result = answerGraphJsonSchema.safeParse({
      version: 1,
      nodes: [],
      edges: [],
      claims: [],
      alerts: [
        {
          id: "a1",
          level: "severe",
          message: "bad",
          weight: 0.3,
          missingEvidence: false,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing nodes", () => {
    const result = answerGraphJsonSchema.safeParse({
      version: 1,
      edges: [],
      claims: [],
      alerts: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("parseAnswerGraphJson", () => {
  it("returns empty graph for invalid payloads", () => {
    expect(parseAnswerGraphJson(null)).toEqual({
      version: 1,
      nodes: [],
      edges: [],
      claims: [],
      alerts: [],
    });
  });
});
