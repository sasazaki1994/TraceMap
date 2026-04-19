import { describe, expect, it } from "vitest";

import { describeGraphNodeTie } from "@/features/run/lib/graph-node-tie-label";

describe("describeGraphNodeTie", () => {
  const graph = {
    version: 1 as const,
    nodes: [
      { id: "node_answer", kind: "answer" as const, label: "Synthesis (mock)" },
    ],
    edges: [],
  };

  it("returns null when graphNodeId is null", () => {
    expect(describeGraphNodeTie(graph, null)).toBeNull();
  });

  it("resolves kind and label from graph_json", () => {
    const tie = describeGraphNodeTie(graph, "node_answer");
    expect(tie).toEqual({
      nodeId: "node_answer",
      kindLabel: "Answer",
      nodeLabel: "Synthesis (mock)",
    });
  });

  it("falls back to id when node is missing from graph", () => {
    const tie = describeGraphNodeTie(graph, "orphan");
    expect(tie?.nodeId).toBe("orphan");
    expect(tie?.kindLabel).toBe("Node");
    expect(tie?.nodeLabel).toBe("orphan");
  });
});
