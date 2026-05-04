import { describe, expect, it } from "vitest";

import { parseRunCachePayload } from "@/server/analysis/parse-run-cache-payload";
import type { GeneratedAnswerGraphPayload } from "@/types/answer-graph-generation";

function validPayload(): GeneratedAnswerGraphPayload {
  return {
    answer: {
      title: "Cached answer",
      model: "mock",
      content: "Cached content.",
      graphJson: {
        version: 3,
        nodes: [
          { id: "node_question", kind: "question", label: "Q" },
          { id: "node_answer", kind: "answer", label: "A" },
          {
            id: "node_source_0",
            kind: "source",
            label: "Source A",
            sourceSnapshotId: "__src_0__",
          },
          { id: "node_claim_0", kind: "claim", label: "Claim" },
        ],
        edges: [
          { id: "edge_q_a", from: "node_question", to: "node_answer" },
          {
            id: "edge_s0_c0",
            from: "node_source_0",
            to: "node_claim_0",
            label: "supports",
          },
        ],
      },
    },
    sources: [
      {
        label: "Source A",
        sourceType: "web",
        url: "https://example.com/a",
        excerpt: "Excerpt",
        publishedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    evidence: {
      claims: [
        {
          summary: "Claim summary",
          graphNodeId: "node_claim_0",
          supportedSourcePlaceholderIds: ["__src_0__"],
          supports: [
            {
              sourcePlaceholderId: "__src_0__",
              supportKind: "direct",
              isPrimarySource: true,
              supportingQuote: "Quote",
            },
          ],
          propagationChain: [
            {
              stepKind: "source",
              order: 0,
              label: "Source A",
              sourcePlaceholderId: "__src_0__",
            },
          ],
        },
      ],
    },
  };
}

describe("parseRunCachePayload", () => {
  it("parses a valid GeneratedAnswerGraphPayload", () => {
    const result = parseRunCachePayload(JSON.parse(JSON.stringify(validPayload())));

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.payload.answer.content).toBe("Cached content.");
      expect(result.payload.sources[0].publishedAt).toBeInstanceOf(Date);
    }
  });

  it("fails when graphJson is invalid", () => {
    const payload = validPayload();
    payload.answer.graphJson = { version: 999, nodes: [], edges: [] } as never;

    const result = parseRunCachePayload(payload);

    expect(result.kind).toBe("failure");
  });

  it("fails when sources are missing", () => {
    const payload = validPayload() as unknown as Record<string, unknown>;
    delete payload.sources;

    const result = parseRunCachePayload(payload);

    expect(result.kind).toBe("failure");
  });

  it("fails when answer content is missing", () => {
    const payload = validPayload() as unknown as { answer: Record<string, unknown> };
    delete payload.answer.content;

    const result = parseRunCachePayload(payload);

    expect(result.kind).toBe("failure");
  });

  it("fails when evidence references an unknown placeholder", () => {
    const payload = validPayload();
    payload.evidence?.claims[0].supportedSourcePlaceholderIds.push("__src_3__");

    const result = parseRunCachePayload(payload);

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.errorMessage).toContain("outside the sources range");
    }
  });

  it("rejects DB ids in sourceSnapshotId fields", () => {
    const payload = validPayload();
    const sourceNode = payload.answer.graphJson.nodes.find(
      (node) => node.kind === "source",
    );
    if (sourceNode) {
      sourceNode.sourceSnapshotId = "clrunlocalsourceid";
    }

    const result = parseRunCachePayload(payload);

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.errorMessage).toContain("__src_i__");
    }
  });
});
