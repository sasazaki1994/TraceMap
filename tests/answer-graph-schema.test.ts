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

  it("rejects wrong version", () => {
    const result = answerGraphJsonSchema.safeParse({
      version: 3,
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
