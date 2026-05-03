import {
  INVESTIGATION_LIMITS,
  type InvestigationLimits,
} from "@/server/analysis/investigation-limits";

export const INSUFFICIENT_GROUNDING_MESSAGE =
  "The model could not ground this answer with sufficient evidence from real sources.";

export type InvestigationPipelineFailureReason =
  | "insufficient_grounding"
  | "invalid_json"
  | "invalid_source_url"
  | "too_few_sources"
  | "no_claims"
  | "unknown_source_reference"
  | "output_limit_invalidated_evidence"
  | "provider_exception";

export type StructuredSupportKind = "direct" | "supplemental" | "indirect";

export type StructuredCounterpointRelationKind =
  | "contradiction"
  | "alternative_interpretation"
  | "different_premise"
  | "different_definition"
  | "temporal_mismatch";

export type StructuredPropagationStepKind =
  | "source"
  | "evidence_snippet"
  | "source_interpretation"
  | "claim"
  | "answer_segment";

export type StructuredAlertLevel = "info" | "warning" | "error";

export type StructuredAnswerPayload = {
  sufficient_grounding: boolean;
  answer_title: string;
  answer_content: string;
  claims: StructuredAnswerClaim[];
  sources: StructuredAnswerSource[];
  counterpoint_summary?: string;
  alert?: { level: StructuredAlertLevel; message: string };
};

export type StructuredAnswerSource = {
  id: string;
  label: string;
  source_type: "web" | "document" | "note";
  url: string;
  excerpt: string;
};

export type StructuredAnswerClaim = {
  id: string;
  summary: string;
  supported_by_source_ids: string[];
  support_relations?: StructuredSupportRelation[];
  counterpoints?: StructuredCounterpoint[];
  propagation_chain?: StructuredPropagationStep[];
  alerts?: StructuredClaimAlert[];
};

export type StructuredSupportRelation = {
  source_id: string;
  support_kind: StructuredSupportKind;
  is_primary_source?: boolean;
  supporting_quote?: string;
  contradiction_note?: string;
};

export type StructuredCounterpoint = {
  summary: string;
  relationship_kind?: StructuredCounterpointRelationKind;
};

export type StructuredPropagationStep = {
  step_kind: StructuredPropagationStepKind;
  source_id?: string;
  label: string;
  content?: string;
};

export type StructuredClaimAlert = {
  level: StructuredAlertLevel;
  message: string;
};

export type NormalizeGeneratedAnswerGraphResult =
  | {
      kind: "ok";
      payload: StructuredAnswerPayload;
      normalizedSources: { id: string; url: string }[];
      droppedClaimIds: string[];
    }
  | {
      kind: "failure";
      reason: InvestigationPipelineFailureReason;
      errorMessage: string;
    };

function failure(
  reason: InvestigationPipelineFailureReason,
  errorMessage: string,
): NormalizeGeneratedAnswerGraphResult {
  return { kind: "failure", reason, errorMessage };
}

function trimToLimit(value: string, maxChars: number): string {
  const trimmed = value.trim();
  const chars = Array.from(trimmed);
  if (chars.length <= maxChars) {
    return trimmed;
  }
  return chars.slice(0, maxChars).join("").trimEnd();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

/** http(s) only, parseable URL, non-empty host. */
export function isValidPublicHttpUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }
  return url.hostname.length > 0;
}

function validateSources(
  sources: StructuredAnswerSource[],
): NormalizeGeneratedAnswerGraphResult | { kind: "ok"; ids: Set<string> } {
  if (sources.length < 2) {
    return failure(
      "too_few_sources",
      "OpenAI structured output must include at least two sources with valid http(s) URLs.",
    );
  }

  const ids = new Set<string>();
  for (const source of sources) {
    const sourceId = source.id.trim();
    if (!sourceId) {
      return failure("invalid_source_url", "Each source must have a non-empty id.");
    }
    if (ids.has(sourceId)) {
      return failure("invalid_source_url", `Duplicate source id in structured output: ${sourceId}.`);
    }
    ids.add(sourceId);

    const url = source.url.trim();
    if (!isValidPublicHttpUrl(url)) {
      return failure(
        "invalid_source_url",
        `Invalid source URL for source id ${sourceId}: only http or https URLs with a host are allowed.`,
      );
    }
  }

  return { kind: "ok", ids };
}

function validateClaims(
  claims: StructuredAnswerClaim[],
  sourceIds: Set<string>,
): NormalizeGeneratedAnswerGraphResult | { kind: "ok" } {
  if (claims.length === 0) {
    return failure(
      "no_claims",
      "OpenAI structured output must include at least one claim linked to sources.",
    );
  }

  for (const claim of claims) {
    if (!Array.isArray(claim.supported_by_source_ids) || claim.supported_by_source_ids.length === 0) {
      return failure(
        "unknown_source_reference",
        "Each claim must list at least one supported_by_source_ids entry.",
      );
    }

    for (const rawSourceId of claim.supported_by_source_ids) {
      const sourceId = rawSourceId.trim();
      if (!sourceIds.has(sourceId)) {
        return failure(
          "unknown_source_reference",
          `Claim references unknown source id: ${sourceId}.`,
        );
      }
    }
  }

  return { kind: "ok" };
}

function normalizeSources(
  sources: StructuredAnswerSource[],
  limits: InvestigationLimits,
): StructuredAnswerSource[] {
  return sources.slice(0, limits.maxSources).map((source) => ({
    ...source,
    id: source.id.trim(),
    label: source.label.trim(),
    url: source.url.trim(),
    excerpt: trimToLimit(source.excerpt, limits.maxSourceExcerptChars),
  }));
}

function normalizeSupportRelations(params: {
  relations: StructuredSupportRelation[] | undefined;
  retainedSupportedSourceIds: Set<string>;
}): StructuredSupportRelation[] | undefined {
  const normalized =
    params.relations
      ?.filter((relation) => params.retainedSupportedSourceIds.has(relation.source_id.trim()))
      .map((relation) => ({
        ...relation,
        source_id: relation.source_id.trim(),
        supporting_quote:
          relation.supporting_quote !== undefined
            ? relation.supporting_quote.trim()
            : undefined,
        contradiction_note:
          relation.contradiction_note !== undefined
            ? relation.contradiction_note.trim()
            : undefined,
      })) ?? [];

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeCounterpoints(
  counterpoints: StructuredCounterpoint[] | undefined,
  limits: InvestigationLimits,
): StructuredCounterpoint[] | undefined {
  const normalized =
    counterpoints
      ?.filter((counterpoint) => counterpoint.summary.trim() !== "")
      .slice(0, limits.maxCounterpointsPerClaim)
      .map((counterpoint) => ({
        ...counterpoint,
        summary: counterpoint.summary.trim(),
      })) ?? [];

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeAlerts(
  alerts: StructuredClaimAlert[] | undefined,
  limits: InvestigationLimits,
): StructuredClaimAlert[] | undefined {
  const normalized =
    alerts
      ?.filter((alert) => alert.message.trim() !== "")
      .slice(0, limits.maxAlertsPerClaim)
      .map((alert) => ({
        ...alert,
        message: alert.message.trim(),
      })) ?? [];

  return normalized.length > 0 ? normalized : undefined;
}

function normalizePropagationChain(params: {
  chain: StructuredPropagationStep[] | undefined;
  retainedSourceIds: Set<string>;
  limits: InvestigationLimits;
}): StructuredPropagationStep[] | undefined {
  const normalized =
    params.chain
      ?.slice(0, params.limits.maxPropagationStepsPerClaim)
      .map((step) => {
        const sourceId = step.source_id?.trim();
        return {
          ...step,
          label: step.label.trim(),
          content: step.content?.trim(),
          source_id:
            sourceId !== undefined && params.retainedSourceIds.has(sourceId)
              ? sourceId
              : undefined,
        };
      })
      .filter((step) => step.label !== "") ?? [];

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeClaims(params: {
  claims: StructuredAnswerClaim[];
  retainedSourceIds: Set<string>;
  limits: InvestigationLimits;
}): { claims: StructuredAnswerClaim[]; droppedClaimIds: string[] } {
  const normalized: StructuredAnswerClaim[] = [];
  const droppedClaimIds: string[] = [];

  for (const claim of params.claims) {
    if (normalized.length >= params.limits.maxClaims) {
      break;
    }

    const retainedSupportedSourceIds = uniqueStrings(
      claim.supported_by_source_ids
        .map((sourceId) => sourceId.trim())
        .filter((sourceId) => params.retainedSourceIds.has(sourceId)),
    );

    if (retainedSupportedSourceIds.length === 0) {
      droppedClaimIds.push(claim.id.trim() || claim.summary.trim());
      continue;
    }

    const retainedSupportedSourceIdSet = new Set(retainedSupportedSourceIds);
    normalized.push({
      ...claim,
      id: claim.id.trim(),
      summary: trimToLimit(claim.summary, params.limits.maxClaimSummaryChars),
      supported_by_source_ids: retainedSupportedSourceIds,
      support_relations: normalizeSupportRelations({
        relations: claim.support_relations,
        retainedSupportedSourceIds: retainedSupportedSourceIdSet,
      }),
      counterpoints: normalizeCounterpoints(claim.counterpoints, params.limits),
      propagation_chain: normalizePropagationChain({
        chain: claim.propagation_chain,
        retainedSourceIds: params.retainedSourceIds,
        limits: params.limits,
      }),
      alerts: normalizeAlerts(claim.alerts, params.limits),
    });
  }

  return { claims: normalized, droppedClaimIds };
}

export function normalizeGeneratedAnswerGraph(
  payload: StructuredAnswerPayload,
  limits: InvestigationLimits = INVESTIGATION_LIMITS,
): NormalizeGeneratedAnswerGraphResult {
  if (payload.sufficient_grounding !== true) {
    return failure("insufficient_grounding", INSUFFICIENT_GROUNDING_MESSAGE);
  }

  const sourceValidation = validateSources(payload.sources);
  if (sourceValidation.kind === "failure") {
    return sourceValidation;
  }

  const claimValidation = validateClaims(payload.claims, sourceValidation.ids);
  if (claimValidation.kind === "failure") {
    return claimValidation;
  }

  const sources = normalizeSources(payload.sources, limits);
  if (sources.length < 2) {
    return failure(
      "output_limit_invalidated_evidence",
      "Investigation output limits removed too many sources to preserve required evidence.",
    );
  }

  const retainedSourceIds = new Set(sources.map((source) => source.id));
  const { claims, droppedClaimIds } = normalizeClaims({
    claims: payload.claims,
    retainedSourceIds,
    limits,
  });

  if (claims.length === 0) {
    return failure(
      "output_limit_invalidated_evidence",
      "Investigation output limits removed all claims with retained source support.",
    );
  }

  return {
    kind: "ok",
    payload: {
      ...payload,
      answer_title: payload.answer_title.trim(),
      answer_content: trimToLimit(
        payload.answer_content,
        limits.maxAnswerContentChars,
      ),
      sources,
      claims,
      counterpoint_summary:
        payload.counterpoint_summary !== undefined
          ? payload.counterpoint_summary.trim()
          : undefined,
      alert:
        payload.alert !== undefined
          ? { ...payload.alert, message: payload.alert.message.trim() }
          : undefined,
    },
    normalizedSources: sources.map((source) => ({
      id: source.id,
      url: source.url,
    })),
    droppedClaimIds,
  };
}
