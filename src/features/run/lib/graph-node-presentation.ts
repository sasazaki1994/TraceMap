import type { GraphNode } from "@/types/answer-graph";

export function graphNodeShortLabel(kind: GraphNode["kind"]): string {
  switch (kind) {
    case "question":
      return "Q";
    case "answer":
      return "A";
    case "source":
      return "S";
    case "claim":
      return "C";
    case "counterclaim":
      return "CP";
    case "interpretation":
      return "I";
    case "answer_segment":
      return "AS";
  }
}

export function graphNodeKindLabel(kind: GraphNode["kind"]): string {
  switch (kind) {
    case "question":
      return "Question";
    case "answer":
      return "Answer";
    case "source":
      return "Source";
    case "claim":
      return "Claim";
    case "counterclaim":
      return "Counterclaim";
    case "interpretation":
      return "Interpretation";
    case "answer_segment":
      return "Answer segment";
  }
}

export function isSelectableGraphNode(node: GraphNode): boolean {
  return node.kind === "source" || node.kind === "question" || node.kind === "answer" || node.kind === "claim";
}
