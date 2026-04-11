import { z } from "zod";

export const graphNodeKindSchema = z.enum(["question", "answer", "source"]);

export const graphNodeSchema = z.object({
  id: z.string().min(1),
  kind: graphNodeKindSchema,
  label: z.string(),
  sourceSnapshotId: z.string().min(1).optional(),
});

export const graphEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
});

export const answerGraphJsonSchema = z.object({
  version: z.literal(1),
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});

export type AnswerGraphJson = z.infer<typeof answerGraphJsonSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

const emptyGraph: AnswerGraphJson = { version: 1, nodes: [], edges: [] };

export function parseAnswerGraphJson(value: unknown): AnswerGraphJson {
  const result = answerGraphJsonSchema.safeParse(value);
  return result.success ? result.data : emptyGraph;
}
