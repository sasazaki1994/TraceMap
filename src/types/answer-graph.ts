import { z } from "zod";

export const graphEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
  supportType: z.enum(["direct", "supplemental", "indirect"]).optional(),
  relationType: z
    .enum([
      "supports",
      "derived_from",
      "contradiction",
      "alternative_interpretation",
      "different_premise",
      "different_definition",
      "temporal_mismatch",
      "interpretation",
      "interprets",
      "quotes",
      "summarizes",
      "propagates_to",
      "contributes_to",
    ])
    .optional(),
});

const graphNodeV1Schema = z.object({
  id: z.string().min(1),
  kind: z.enum(["question", "answer", "source"]),
  label: z.string(),
  sourceSnapshotId: z.string().min(1).optional(),
});

const graphNodeV2Schema = z.object({
  id: z.string().min(1),
  kind: z.enum(["question", "answer", "source", "claim"]),
  label: z.string(),
  sourceSnapshotId: z.string().min(1).optional(),
});

const graphNodeV3Schema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "question",
    "answer",
    "source",
    "claim",
    "counterclaim",
    "interpretation",
    "answer_segment",
  ]),
  label: z.string(),
  sourceSnapshotId: z.string().min(1).optional(),
});

export const answerGraphJsonSchema = z.union([
  z.object({
    version: z.literal(1),
    nodes: z.array(graphNodeV1Schema),
    edges: z.array(graphEdgeSchema),
  }),
  z.object({
    version: z.literal(2),
    nodes: z.array(graphNodeV2Schema),
    edges: z.array(graphEdgeSchema),
  }),
  z.object({
    version: z.literal(3),
    nodes: z.array(graphNodeV3Schema),
    edges: z.array(graphEdgeSchema),
  }),
]);

export type AnswerGraphJson = z.infer<typeof answerGraphJsonSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type GraphNode = AnswerGraphJson["nodes"][number];

const emptyGraph: AnswerGraphJson = { version: 1, nodes: [], edges: [] };

export function parseAnswerGraphJson(value: unknown): AnswerGraphJson {
  const result = answerGraphJsonSchema.safeParse(value);
  return result.success ? result.data : emptyGraph;
}

export function isAnswerGraphV2(graph: AnswerGraphJson): graph is Extract<
  AnswerGraphJson,
  { version: 2 }
> {
  return graph.version === 2;
}

export function isAnswerGraphV3(graph: AnswerGraphJson): graph is Extract<
  AnswerGraphJson,
  { version: 3 }
> {
  return graph.version === 3;
}
