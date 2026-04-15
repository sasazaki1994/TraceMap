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

export const graphClaimSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  weight: z.number().min(0).max(1).default(0.5),
  missingEvidence: z.boolean().default(false),
  sourceNodeIds: z.array(z.string().min(1)).default([]),
});

export const graphAlertLevelSchema = z.enum(["info", "warning", "critical"]);

export const graphAlertSchema = z.object({
  id: z.string().min(1),
  level: graphAlertLevelSchema,
  message: z.string().min(1),
  weight: z.number().min(0).max(1).default(0.5),
  claimId: z.string().min(1).optional(),
  missingEvidence: z.boolean().default(false),
});

export const answerGraphJsonSchema = z.object({
  version: z.literal(1),
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  claims: z.array(graphClaimSchema).default([]),
  alerts: z.array(graphAlertSchema).default([]),
});

export type AnswerGraphJson = z.infer<typeof answerGraphJsonSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type GraphClaim = z.infer<typeof graphClaimSchema>;
export type GraphAlert = z.infer<typeof graphAlertSchema>;

const emptyGraph: AnswerGraphJson = {
  version: 1,
  nodes: [],
  edges: [],
  claims: [],
  alerts: [],
};

export function parseAnswerGraphJson(value: unknown): AnswerGraphJson {
  const result = answerGraphJsonSchema.safeParse(value);
  return result.success ? result.data : emptyGraph;
}
