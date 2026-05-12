import type { AnswerGraphJson } from "@/types/answer-graph";

export function layoutAnswerGraph(
  graph: AnswerGraphJson,
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const cx = width / 2;

  const byKind = {
    question: graph.nodes.filter((n) => n.kind === "question"),
    answer: graph.nodes.filter((n) => n.kind === "answer"),
    answer_segment: graph.nodes.filter((n) => n.kind === "answer_segment"),
    claim: graph.nodes.filter((n) => n.kind === "claim"),
    counterclaim: graph.nodes.filter((n) => n.kind === "counterclaim"),
    interpretation: graph.nodes.filter((n) => n.kind === "interpretation"),
    source: graph.nodes.filter((n) => n.kind === "source"),
  } as const;

  const placeRow = (nodes: { id: string }[], y: number, min = 64, max = width - 64) => {
    const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    sorted.forEach((node, i) => {
      if (sorted.length === 1) {
        map.set(node.id, { x: cx, y });
      } else {
        const x = min + (i * (max - min)) / Math.max(sorted.length - 1, 1);
        map.set(node.id, { x, y });
      }
    });
  };

  placeRow(byKind.question, 34);
  placeRow(byKind.answer, 84);
  placeRow(byKind.answer_segment, 122);
  placeRow(byKind.claim, 162);
  placeRow(byKind.counterclaim, 138);
  placeRow(byKind.interpretation, 196);
  placeRow(byKind.source, Math.min(height - 38, 232));

  return map;
}
