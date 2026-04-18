import type { AnswerGraphJson } from "@/types/answer-graph";

/** Resolved labels for showing a Claim's `graph_node_id` next to `graph_json` nodes. */
export function describeGraphNodeTie(
  graph: AnswerGraphJson,
  graphNodeId: string | null,
): { nodeId: string; kindLabel: string; nodeLabel: string } | null {
  if (!graphNodeId) {
    return null;
  }
  const node = graph.nodes.find((n) => n.id === graphNodeId);
  const kindLabel =
    node?.kind === "question"
      ? "Question"
      : node?.kind === "answer"
        ? "Answer"
        : node?.kind === "source"
          ? "Source"
          : "Node";

  return {
    nodeId: graphNodeId,
    kindLabel,
    nodeLabel: node?.label ?? graphNodeId,
  };
}
