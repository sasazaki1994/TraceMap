import type { AnswerGraphJson } from "@/types/answer-graph";

/** Claimの`graph_node_id`を`graph_json`ノード横に表示するための解決済みラベル。 */
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
          : node?.kind === "claim"
            ? "Claim"
            : "Node";

  return {
    nodeId: graphNodeId,
    kindLabel,
    nodeLabel: node?.label ?? graphNodeId,
  };
}
