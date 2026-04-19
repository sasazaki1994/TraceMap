import { describe, expect, it } from "vitest";

import { stubAnswerGraphProvider } from "@/server/analysis/providers/stub-answer-graph-provider";
import type { GraphNode } from "@/types/answer-graph";

describe("stubAnswerGraphProvider", () => {
  it("returns a minimal graph without sources or evidence rows", async () => {
    const result = await stubAnswerGraphProvider.generateAnswerGraph({
      question: "Test?",
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") {
      return;
    }
    expect(result.payload.sources).toHaveLength(0);
    expect(result.payload.evidence).toBeUndefined();
    expect(result.payload.answer.model).toBe("stub");
    expect(
      result.payload.answer.graphJson.nodes.some((n: GraphNode) => n.kind === "source"),
    ).toBe(false);
  });
});
