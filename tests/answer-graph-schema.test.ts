import { describe, expect, it } from "vitest";

import {
  answerGraphJsonSchema,
  parseAnswerGraphJson,
} from "@/types/answer-graph";

describe("answerGraphJsonSchema", () => {
  it("accepts a valid v1 graph", () => {
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
    };
    expect(answerGraphJsonSchema.safeParse(value).success).toBe(true);
  });

  it("accepts v2 with claim nodes", () => {
    const value = {
      version: 2 as const,
      nodes: [
        { id: "n1", kind: "question" as const, label: "Q?" },
        { id: "n2", kind: "answer" as const, label: "A" },
        {
          id: "n3",
          kind: "source" as const,
          label: "S",
          sourceSnapshotId: "clxyz",
        },
        { id: "n4", kind: "claim" as const, label: "C1" },
      ],
      edges: [
        { id: "e1", from: "n3", to: "n4" },
        { id: "e2", from: "n4", to: "n2" },
      ],
    };
    expect(answerGraphJsonSchema.safeParse(value).success).toBe(true);
  });

  it("accepts v2 edges with support metadata", () => {
    const value = {
      version: 2 as const,
      nodes: [
        { id: "n1", kind: "question" as const, label: "Q?" },
        { id: "n2", kind: "answer" as const, label: "A" },
        {
          id: "n3",
          kind: "source" as const,
          label: "S",
          sourceSnapshotId: "clxyz",
        },
        { id: "n4", kind: "claim" as const, label: "C1" },
      ],
      edges: [
        {
          id: "e1",
          from: "n3",
          to: "n4",
          label: "supports",
          supportType: "direct" as const,
        },
        { id: "e2", from: "n4", to: "n2" },
      ],
    };
    expect(answerGraphJsonSchema.safeParse(value).success).toBe(true);
  });

  it("accepts v3 with counterclaim, interpretation, and answer segment nodes", () => {
    const value = {
      version: 3 as const,
      nodes: [
        { id: "n1", kind: "question" as const, label: "Q?" },
        { id: "n2", kind: "answer", label: "A" },
        { id: "n3", kind: "source", label: "Source", sourceSnapshotId: "src-1" },
        { id: "n4", kind: "claim", label: "Claim" },
        { id: "n5", kind: "counterclaim", label: "Counterclaim" },
        { id: "n6", kind: "interpretation", label: "Interpretation" },
        { id: "n7", kind: "answer_segment", label: "Answer segment" },
      ],
      edges: [
        { id: "e1", from: "n3", to: "n6", relationType: "quotes" as const },
        { id: "e2", from: "n6", to: "n4", relationType: "supports" as const },
        {
          id: "e3",
          from: "n5",
          to: "n4",
          relationType: "contradiction" as const,
          counterRelationKind: "contradiction" as const,
        },
        { id: "e4", from: "n4", to: "n7", relationType: "contributes_to" as const },
        { id: "e5", from: "n7", to: "n2", relationType: "supports" as const },
      ],
    };
    expect(answerGraphJsonSchema.safeParse(value).success).toBe(true);
  });

  it("rejects wrong version", () => {
    const result = answerGraphJsonSchema.safeParse({
      version: 4,
      nodes: [],
      edges: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing nodes", () => {
    const result = answerGraphJsonSchema.safeParse({
      version: 1,
      edges: [],
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
    });
  });
});
