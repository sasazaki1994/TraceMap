/** Serializable claim row + nested counterpoints for run / share pages. */
export type RunEvidenceClaim = {
  id: string;
  summary: string;
  /** When set, ties this claim to `graph_json.nodes[].id` (visual graph + optional highlight). */
  graphNodeId: string | null;
  counterpoints: { id: string; summary: string }[];
};

export type AlertLevel = "info" | "warning" | "error";

export type RunEvidenceAlert = {
  id: string;
  level: AlertLevel;
  message: string;
};
