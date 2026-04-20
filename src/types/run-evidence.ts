export type AlertLevel = "info" | "warning" | "error";

/** Serializable claim row + nested counterpoints for run / share pages. */
export type RunEvidenceClaim = {
  id: string;
  summary: string;
  /** When set, ties this claim to `graph_json.nodes[].id` (visual graph + optional highlight). */
  graphNodeId: string | null;
  /** `source_snapshots.id` values linked via `claim_source_snapshots`. */
  supportingSourceIds: string[];
  counterpoints: { id: string; summary: string }[];
  /** Alerts scoped to this claim (`alerts.claim_id` set). */
  alerts: { id: string; level: AlertLevel; message: string }[];
};

/** Answer-wide alert (`alerts.claim_id` null). */
export type RunEvidenceAlert = {
  id: string;
  level: AlertLevel;
  message: string;
};
