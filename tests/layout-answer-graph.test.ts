import { describe, expect, it } from "vitest";

import { layoutAnswerGraph } from "@/features/run/lib/layout-answer-graph";
import { graphNodeShortLabel } from "@/features/run/lib/graph-node-presentation";
import type { AnswerGraphJson } from "@/types/answer-graph";

describe("layoutAnswerGraph", () => {
  it("assigns positions for all v3 node kinds", () => {
    const graph: AnswerGraphJson = {
      version: 3,
      nodes: [
        { id: "q", kind: "question", label: "Q" },
        { id: "a", kind: "answer", label: "A" },
        { id: "as", kind: "answer_segment", label: "AS" },
        { id: "c", kind: "claim", label: "C" },
        { id: "cp", kind: "counterclaim", label: "CP" },
        { id: "i", kind: "interpretation", label: "I" },
        { id: "s", kind: "source", label: "S" },
      ],
      edges: [],
    };

    const positions = layoutAnswerGraph(graph, 420, 260);
    for (const node of graph.nodes) {
      expect(positions.has(node.id)).toBe(true);
    }
  });

  it("keeps v1/v2-style nodes positioned", () => {
    const graph: AnswerGraphJson = {
      version: 2,
      nodes: [
        { id: "q", kind: "question", label: "Q" },
        { id: "a", kind: "answer", label: "A" },
        { id: "s", kind: "source", label: "S" },
        { id: "c", kind: "claim", label: "C" },
      ],
      edges: [],
    };
    const positions = layoutAnswerGraph(graph, 420, 260);
    expect(positions.size).toBe(4);
  });
});

describe("graphNodeShortLabel", () => {
  it("returns short labels for v3 kinds", () => {
    expect(graphNodeShortLabel("counterclaim")).toBe("CP");
    expect(graphNodeShortLabel("interpretation")).toBe("I");
    expect(graphNodeShortLabel("answer_segment")).toBe("AS");
  });
});
