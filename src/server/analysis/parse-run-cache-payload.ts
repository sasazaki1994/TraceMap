import { answerGraphJsonSchema, type AnswerGraphJson } from "@/types/answer-graph";
import type {
  GeneratedAnswerGraphPayload,
  GeneratedEvidenceClaimInput,
  GeneratedPropagationChainStepInput,
  GeneratedSourceSnapshot,
} from "@/types/answer-graph-generation";

type ParseRunCachePayloadResult =
  | { kind: "ok"; payload: GeneratedAnswerGraphPayload }
  | { kind: "failure"; errorMessage: string };

const SOURCE_PLACEHOLDER_PATTERN = /^__src_(\d+)__$/;
type ParseFailure = Extract<ParseRunCachePayloadResult, { kind: "failure" }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isParseFailure(value: unknown): value is ParseFailure {
  return isRecord(value) && value.kind === "failure" && typeof value.errorMessage === "string";
}

function isSourceType(value: unknown): value is GeneratedSourceSnapshot["sourceType"] {
  return value === "web" || value === "document" || value === "note";
}

function isAlertLevel(value: unknown): value is "info" | "warning" | "error" {
  return value === "info" || value === "warning" || value === "error";
}

function isSupportKind(value: unknown): value is "direct" | "supplemental" | "indirect" {
  return value === "direct" || value === "supplemental" || value === "indirect";
}

function isCounterpointRelationKind(
  value: unknown,
): value is NonNullable<GeneratedEvidenceClaimInput["counterpoints"]>[number]["relationKind"] {
  return (
    value === "contradiction" ||
    value === "alternative_interpretation" ||
    value === "different_premise" ||
    value === "different_definition" ||
    value === "temporal_mismatch"
  );
}

function isPropagationStepKind(
  value: unknown,
): value is GeneratedPropagationChainStepInput["stepKind"] {
  return (
    value === "source" ||
    value === "evidence_snippet" ||
    value === "source_interpretation" ||
    value === "claim" ||
    value === "answer_segment"
  );
}

function parseNullableString(value: unknown, fieldName: string): ParseFailure | string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    return { kind: "failure", errorMessage: `${fieldName} must be a string or null.` };
  }
  return value;
}

function parseOptionalDate(value: unknown, fieldName: string): ParseFailure | Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? { kind: "failure", errorMessage: `${fieldName} must be a valid date.` }
      : value;
  }
  if (typeof value !== "string") {
    return { kind: "failure", errorMessage: `${fieldName} must be an ISO date string or null.` };
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? { kind: "failure", errorMessage: `${fieldName} must be a valid date.` }
    : parsed;
}

function parsePlaceholder(
  value: unknown,
  sourceCount: number,
  fieldName: string,
): ParseFailure | string {
  if (typeof value !== "string") {
    return { kind: "failure", errorMessage: `${fieldName} must be a source placeholder.` };
  }
  const match = SOURCE_PLACEHOLDER_PATTERN.exec(value);
  if (!match) {
    return {
      kind: "failure",
      errorMessage: `${fieldName} must use __src_i__ placeholder ids, not run-local DB ids.`,
    };
  }
  const index = Number.parseInt(match[1], 10);
  if (index < 0 || index >= sourceCount) {
    return {
      kind: "failure",
      errorMessage: `${fieldName} references source placeholder outside the sources range.`,
    };
  }
  return value;
}

function validateGraphPlaceholders(graph: AnswerGraphJson, sourceCount: number): ParseFailure | null {
  for (const node of graph.nodes) {
    if (node.kind !== "source" || node.sourceSnapshotId === undefined) {
      continue;
    }
    const parsed = parsePlaceholder(
      node.sourceSnapshotId,
      sourceCount,
      "answer.graphJson.nodes[].sourceSnapshotId",
    );
    if (isParseFailure(parsed)) {
      return parsed;
    }
  }
  return null;
}

function validateNoRunLocalSourceSnapshotIds(
  value: unknown,
  sourceCount: number,
  path: string,
): ParseFailure | null {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const failure = validateNoRunLocalSourceSnapshotIds(item, sourceCount, `${path}[${index}]`);
      if (failure) {
        return failure;
      }
    }
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const [key, nested] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;
    if (key === "sourceSnapshotId") {
      if (path === "payload.sources[]" || path.startsWith("payload.sources[].")) {
        return {
          kind: "failure",
          errorMessage: `${nextPath} must not be stored in run cache payloads.`,
        };
      }
      const parsed = parsePlaceholder(nested, sourceCount, nextPath);
      if (isParseFailure(parsed)) {
        return parsed;
      }
      continue;
    }

    const failure = validateNoRunLocalSourceSnapshotIds(nested, sourceCount, nextPath);
    if (failure) {
      return failure;
    }
  }

  return null;
}

function parseSources(value: unknown): ParseFailure | GeneratedSourceSnapshot[] {
  if (!Array.isArray(value)) {
    return { kind: "failure", errorMessage: "sources must be an array." };
  }

  const sources: GeneratedSourceSnapshot[] = [];
  for (const [index, source] of value.entries()) {
    if (!isRecord(source)) {
      return { kind: "failure", errorMessage: `sources[${index}] must be an object.` };
    }
    if (typeof source.label !== "string" || source.label.trim() === "") {
      return { kind: "failure", errorMessage: `sources[${index}].label is required.` };
    }
    if (!isSourceType(source.sourceType)) {
      return { kind: "failure", errorMessage: `sources[${index}].sourceType is invalid.` };
    }
    const url = parseNullableString(source.url, `sources[${index}].url`);
    if (isParseFailure(url)) {
      return url;
    }
    const excerpt = parseNullableString(source.excerpt, `sources[${index}].excerpt`);
    if (isParseFailure(excerpt)) {
      return excerpt;
    }
    if ("sourceSnapshotId" in source) {
      return {
        kind: "failure",
        errorMessage: `sources[${index}].sourceSnapshotId must not be stored in run cache payloads.`,
      };
    }
    const publishedAt = parseOptionalDate(source.publishedAt, `sources[${index}].publishedAt`);
    if (isParseFailure(publishedAt)) {
      return publishedAt;
    }
    sources.push({
      label: source.label,
      sourceType: source.sourceType,
      url,
      excerpt,
      publishedAt,
    });
  }
  return sources;
}

function parseClaimSupports(
  value: unknown,
  sourceCount: number,
  fieldName: string,
): ParseFailure | NonNullable<GeneratedEvidenceClaimInput["supports"]> | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    return { kind: "failure", errorMessage: `${fieldName} must be an array.` };
  }
  const supports: NonNullable<GeneratedEvidenceClaimInput["supports"]> = [];
  for (const [index, support] of value.entries()) {
    if (!isRecord(support)) {
      return { kind: "failure", errorMessage: `${fieldName}[${index}] must be an object.` };
    }
    const sourcePlaceholderId = parsePlaceholder(
      support.sourcePlaceholderId,
      sourceCount,
      `${fieldName}[${index}].sourcePlaceholderId`,
    );
    if (isParseFailure(sourcePlaceholderId)) {
      return sourcePlaceholderId;
    }
    if (!isSupportKind(support.supportKind)) {
      return { kind: "failure", errorMessage: `${fieldName}[${index}].supportKind is invalid.` };
    }
    const supportingQuote = parseNullableString(
      support.supportingQuote,
      `${fieldName}[${index}].supportingQuote`,
    );
    if (isParseFailure(supportingQuote)) {
      return supportingQuote;
    }
    const contradictionNote = parseNullableString(
      support.contradictionNote,
      `${fieldName}[${index}].contradictionNote`,
    );
    if (isParseFailure(contradictionNote)) {
      return contradictionNote;
    }
    supports.push({
      sourcePlaceholderId,
      supportKind: support.supportKind,
      isPrimarySource: support.isPrimarySource === true,
      supportingQuote,
      contradictionNote,
    });
  }
  return supports;
}

function parsePropagationChain(
  value: unknown,
  sourceCount: number,
  fieldName: string,
): ParseFailure | GeneratedPropagationChainStepInput[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    return { kind: "failure", errorMessage: `${fieldName} must be an array.` };
  }
  const steps: GeneratedPropagationChainStepInput[] = [];
  for (const [index, step] of value.entries()) {
    if (!isRecord(step)) {
      return { kind: "failure", errorMessage: `${fieldName}[${index}] must be an object.` };
    }
    if (!isPropagationStepKind(step.stepKind)) {
      return { kind: "failure", errorMessage: `${fieldName}[${index}].stepKind is invalid.` };
    }
    if (typeof step.order !== "number" || !Number.isInteger(step.order)) {
      return { kind: "failure", errorMessage: `${fieldName}[${index}].order must be an integer.` };
    }
    if (typeof step.label !== "string" || step.label.trim() === "") {
      return { kind: "failure", errorMessage: `${fieldName}[${index}].label is required.` };
    }
    const sourcePlaceholderId =
      step.sourcePlaceholderId === null || step.sourcePlaceholderId === undefined
        ? null
        : parsePlaceholder(
            step.sourcePlaceholderId,
            sourceCount,
            `${fieldName}[${index}].sourcePlaceholderId`,
          );
    if (isParseFailure(sourcePlaceholderId)) {
      return sourcePlaceholderId;
    }
    steps.push({
      stepKind: step.stepKind,
      order: step.order,
      label: step.label,
      detail:
        typeof step.detail === "string"
          ? step.detail
          : step.detail === null || step.detail === undefined
            ? null
            : undefined,
      sourcePlaceholderId,
      claimGraphNodeId:
        typeof step.claimGraphNodeId === "string" ? step.claimGraphNodeId : null,
      answerSegmentKey:
        typeof step.answerSegmentKey === "string" ? step.answerSegmentKey : null,
    });
  }
  return steps;
}

function parseEvidence(
  value: unknown,
  sourceCount: number,
): ParseFailure | GeneratedAnswerGraphPayload["evidence"] {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value) || !Array.isArray(value.claims)) {
    return { kind: "failure", errorMessage: "evidence.claims must be an array when evidence exists." };
  }

  const claims: GeneratedEvidenceClaimInput[] = [];
  for (const [index, claim] of value.claims.entries()) {
    if (!isRecord(claim)) {
      return { kind: "failure", errorMessage: `evidence.claims[${index}] must be an object.` };
    }
    if (typeof claim.summary !== "string" || claim.summary.trim() === "") {
      return { kind: "failure", errorMessage: `evidence.claims[${index}].summary is required.` };
    }
    const supportedSourcePlaceholderIds = Array.isArray(claim.supportedSourcePlaceholderIds)
      ? claim.supportedSourcePlaceholderIds
      : [];
    const parsedPlaceholders = supportedSourcePlaceholderIds.map((placeholder, placeholderIndex) =>
      parsePlaceholder(
        placeholder,
        sourceCount,
        `evidence.claims[${index}].supportedSourcePlaceholderIds[${placeholderIndex}]`,
      ),
    );
    const placeholderFailure = parsedPlaceholders.find(isParseFailure);
    if (placeholderFailure) {
      return placeholderFailure;
    }

    const supports = parseClaimSupports(
      claim.supports,
      sourceCount,
      `evidence.claims[${index}].supports`,
    );
    if (isParseFailure(supports)) {
      return supports;
    }
    const propagationChain = parsePropagationChain(
      claim.propagationChain,
      sourceCount,
      `evidence.claims[${index}].propagationChain`,
    );
    if (isParseFailure(propagationChain)) {
      return propagationChain;
    }
    claims.push({
      summary: claim.summary,
      graphNodeId: typeof claim.graphNodeId === "string" ? claim.graphNodeId : null,
      supportedSourcePlaceholderIds: parsedPlaceholders as string[],
      supports,
      propagationChain,
      counterpoints: Array.isArray(claim.counterpoints)
        ? claim.counterpoints.flatMap((counterpoint) => {
            if (!isRecord(counterpoint) || typeof counterpoint.summary !== "string") {
              return [];
            }
            return [
              {
                summary: counterpoint.summary,
                relationKind: isCounterpointRelationKind(counterpoint.relationKind)
                  ? counterpoint.relationKind
                  : undefined,
                graphNodeId:
                  typeof counterpoint.graphNodeId === "string" ? counterpoint.graphNodeId : null,
              },
            ];
          })
        : undefined,
      alerts: Array.isArray(claim.alerts)
        ? claim.alerts.flatMap((alert) => {
            if (!isRecord(alert) || !isAlertLevel(alert.level) || typeof alert.message !== "string") {
              return [];
            }
            return [{ level: alert.level, message: alert.message }];
          })
        : undefined,
    });
  }

  const evidence: GeneratedAnswerGraphPayload["evidence"] = { claims };
  if (isRecord(value.counterpoint) && typeof value.counterpoint.summary === "string") {
    evidence.counterpoint = { summary: value.counterpoint.summary };
  }
  if (isRecord(value.alert) && isAlertLevel(value.alert.level) && typeof value.alert.message === "string") {
    evidence.alert = { level: value.alert.level, message: value.alert.message };
  }
  return evidence;
}

export function parseRunCachePayload(value: unknown): ParseRunCachePayloadResult {
  if (!isRecord(value) || !isRecord(value.answer)) {
    return { kind: "failure", errorMessage: "payload.answer is required." };
  }
  if (typeof value.answer.content !== "string" || value.answer.content.trim() === "") {
    return { kind: "failure", errorMessage: "answer.content must be a non-empty string." };
  }

  const sources = parseSources(value.sources);
  if (isParseFailure(sources)) {
    return sources;
  }
  const sourceSnapshotIdResult = validateNoRunLocalSourceSnapshotIds(
    value,
    sources.length,
    "payload",
  );
  if (sourceSnapshotIdResult) {
    return sourceSnapshotIdResult;
  }

  const graphResult = answerGraphJsonSchema.safeParse(value.answer.graphJson);
  if (!graphResult.success) {
    return { kind: "failure", errorMessage: "answer.graphJson is invalid." };
  }
  const graphPlaceholderResult = validateGraphPlaceholders(graphResult.data, sources.length);
  if (graphPlaceholderResult !== null) {
    return graphPlaceholderResult;
  }

  const evidence = parseEvidence(value.evidence, sources.length);
  if (isParseFailure(evidence)) {
    return evidence;
  }

  return {
    kind: "ok",
    payload: {
      answer: {
        title: typeof value.answer.title === "string" ? value.answer.title : null,
        model: typeof value.answer.model === "string" ? value.answer.model : null,
        content: value.answer.content,
        graphJson: graphResult.data,
      },
      sources,
      evidence,
    },
  };
}
