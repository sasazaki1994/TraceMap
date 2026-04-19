import OpenAI from "openai";

import type { AnswerGraphProvider } from "@/server/analysis/answer-graph-provider";
import { answerGraphJsonSchema, type AnswerGraphJson } from "@/types/answer-graph";
import type {
  GeneratedAnswerGraphPayload,
  GenerateAnswerGraphInput,
  GenerateAnswerGraphResult,
} from "@/types/answer-graph-generation";

/** User-visible when `sufficient_grounding` is false in structured output. */
export const OPENAI_INSUFFICIENT_GROUNDING_MESSAGE =
  "The model could not ground this answer with sufficient evidence from real sources.";

const OPENAI_STRUCTURED_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    sufficient_grounding: {
      type: "boolean",
      description:
        "Set to false if you cannot cite at least two distinct real http(s) URLs and tie claims to them. Do not invent URLs to pass validation.",
    },
    answer_title: {
      type: "string",
      description: "Short title for the synthesized answer.",
    },
    answer_content: {
      type: "string",
      description: "Main answer text in markdown-friendly plain text.",
    },
    claims: {
      type: "array",
      description: "Atomic claims; each must cite source ids from the sources array.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          summary: { type: "string" },
          supported_by_source_ids: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            description: "Ids from sources[].id that support this claim.",
          },
        },
        required: ["id", "summary", "supported_by_source_ids"],
      },
    },
    sources: {
      type: "array",
      description: "At least two distinct real web pages (http or https URLs with a host).",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          source_type: {
            type: "string",
            enum: ["web", "document", "note"],
          },
          url: {
            type: "string",
            description: "Real public http(s) URL; must not be empty when sufficient_grounding is true.",
          },
          excerpt: { type: "string" },
        },
        required: ["id", "label", "source_type", "url", "excerpt"],
      },
    },
    counterpoint_summary: {
      type: "string",
      description: "One counterargument or caveat.",
    },
    alert: {
      type: "object",
      additionalProperties: false,
      properties: {
        level: {
          type: "string",
          enum: ["info", "warning", "error"],
        },
        message: { type: "string" },
      },
      required: ["level", "message"],
    },
  },
  required: [
    "sufficient_grounding",
    "answer_title",
    "answer_content",
    "claims",
    "sources",
    "counterpoint_summary",
    "alert",
  ],
} as const;

type StructuredAnswerPayload = {
  sufficient_grounding: boolean;
  answer_title: string;
  answer_content: string;
  claims: {
    id: string;
    summary: string;
    supported_by_source_ids: string[];
  }[];
  sources: {
    id: string;
    label: string;
    source_type: "web" | "document" | "note";
    url: string;
    excerpt: string;
  }[];
  counterpoint_summary: string;
  alert: { level: "info" | "warning" | "error"; message: string };
};

function getOpenAiConfig(): { apiKey: string | undefined; model: string; timeoutMs: number } {
  const apiKey =
    process.env.TRACEMAP_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || undefined;
  const model =
    process.env.TRACEMAP_OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const timeoutRaw = process.env.TRACEMAP_OPENAI_TIMEOUT_MS?.trim();
  const timeoutMs = timeoutRaw ? Number.parseInt(timeoutRaw, 10) : 60_000;
  return {
    apiKey,
    model,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 60_000,
  };
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

export type ValidateStructuredPayloadResult =
  | { kind: "ok"; normalizedSources: { url: string }[] }
  | Extract<GenerateAnswerGraphResult, { kind: "failure" }>;

/**
 * Validates structured output after JSON parse. Returns failure result or normalized sources (trimmed URLs).
 */
export function validateStructuredAnswerPayload(
  parsed: StructuredAnswerPayload,
): ValidateStructuredPayloadResult {
  if (parsed.sufficient_grounding !== true) {
    return {
      kind: "failure",
      errorMessage: OPENAI_INSUFFICIENT_GROUNDING_MESSAGE,
      cause: parsed,
    };
  }

  if (!Array.isArray(parsed.sources) || parsed.sources.length < 2) {
    return {
      kind: "failure",
      errorMessage:
        "OpenAI structured output must include at least two sources with valid http(s) URLs.",
      cause: parsed,
    };
  }

  const seenSourceIds = new Set<string>();
  const sourceIdToIndex = new Map<string, number>();

  const normalizedSources: { url: string }[] = [];

  for (let i = 0; i < parsed.sources.length; i++) {
    const s = parsed.sources[i];
    const id = s.id?.trim() ?? "";
    if (!id) {
      return {
        kind: "failure",
        errorMessage: "Each source must have a non-empty id.",
        cause: parsed,
      };
    }
    if (seenSourceIds.has(id)) {
      return {
        kind: "failure",
        errorMessage: "Duplicate source id in structured output.",
        cause: parsed,
      };
    }
    seenSourceIds.add(id);
    sourceIdToIndex.set(id, i);

    const urlTrimmed = s.url.trim();
    if (!isValidPublicHttpUrl(urlTrimmed)) {
      return {
        kind: "failure",
        errorMessage:
          "Invalid source URL: only http or https URLs with a host are allowed.",
        cause: parsed,
      };
    }
    normalizedSources.push({ url: urlTrimmed });
  }

  if (!Array.isArray(parsed.claims) || parsed.claims.length === 0) {
    return {
      kind: "failure",
      errorMessage: "OpenAI structured output must include at least one claim linked to sources.",
      cause: parsed,
    };
  }

  for (const claim of parsed.claims) {
    const ids = claim.supported_by_source_ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return {
        kind: "failure",
        errorMessage: "Each claim must list at least one supported_by_source_ids entry.",
        cause: parsed,
      };
    }
    for (const sid of ids) {
      if (!sourceIdToIndex.has(sid)) {
        return {
          kind: "failure",
          errorMessage: `Claim references unknown source id: ${sid}.`,
          cause: parsed,
        };
      }
    }
  }

  return { kind: "ok", normalizedSources };
}

function claimNodeLabel(summary: string): string {
  const t = summary.trim();
  if (t.length <= 72) {
    return t;
  }
  return `${t.slice(0, 69)}...`;
}

function buildGraphAndPayload(
  question: string,
  structured: StructuredAnswerPayload,
  normalizedUrls: string[],
  modelLabel: string,
): GenerateAnswerGraphResult {
  const preview =
    question.length > 120 ? `${question.slice(0, 117)}...` : question;

  const placeholderIds = structured.sources.map(
    (_, i) => `__src_${i}__` as const,
  );

  const sourceNodes = structured.sources.map((s, i) => ({
    id: `node_source_${i}`,
    kind: "source" as const,
    label: s.label,
    sourceSnapshotId: placeholderIds[i],
  }));

  const sourceIdToIndex = new Map<string, number>();
  structured.sources.forEach((s, i) => {
    sourceIdToIndex.set(s.id, i);
  });

  const claimNodes = structured.claims.map((c, ci) => ({
    id: `node_claim_${ci}`,
    kind: "claim" as const,
    label: claimNodeLabel(c.summary),
  }));

  const nodes: AnswerGraphJson["nodes"] = [
    { id: "node_question", kind: "question", label: preview },
    { id: "node_answer", kind: "answer", label: "Synthesis" },
    ...sourceNodes,
    ...claimNodes,
  ];

  const edges: AnswerGraphJson["edges"] = [
    { id: "edge_q_a", from: "node_question", to: "node_answer" },
  ];

  for (let ci = 0; ci < structured.claims.length; ci++) {
    const c = structured.claims[ci];
    const claimId = `node_claim_${ci}`;
    const seen = new Set<string>();
    for (const sid of c.supported_by_source_ids) {
      const idx = sourceIdToIndex.get(sid);
      if (idx === undefined) {
        continue;
      }
      const sourceId = `node_source_${idx}`;
      const dedupeKey = `${sourceId}->${claimId}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      edges.push({
        id: `edge_s${idx}_c${ci}`,
        from: sourceId,
        to: claimId,
        label: "supports",
      });
    }
    edges.push({
      id: `edge_c${ci}_a`,
      from: claimId,
      to: "node_answer",
      label: "supports",
    });
  }

  const graph: AnswerGraphJson = { version: 2, nodes, edges };
  answerGraphJsonSchema.parse(graph);

  const payload: GeneratedAnswerGraphPayload = {
    answer: {
      title: structured.answer_title,
      model: modelLabel,
      content: structured.answer_content,
      graphJson: graph,
    },
    sources: structured.sources.map((s, i) => ({
      label: s.label,
      sourceType: s.source_type,
      url: normalizedUrls[i] ?? s.url.trim(),
      excerpt: s.excerpt.trim() ? s.excerpt : null,
    })),
    evidence: {
      claims: structured.claims.map((c, ci) => ({
        summary: c.summary,
        graphNodeId: `node_claim_${ci}`,
        supportedSourcePlaceholderIds: c.supported_by_source_ids.flatMap((sid) => {
          const idx = sourceIdToIndex.get(sid);
          return idx !== undefined ? [`__src_${idx}__`] : [];
        }),
      })),
      counterpoint: {
        summary: structured.counterpoint_summary,
      },
      alert: {
        level: structured.alert.level,
        message: structured.alert.message,
      },
    },
  };

  return { kind: "success", payload };
}

/**
 * Real provider: OpenAI Chat Completions with Structured Outputs (json_schema).
 * Requires `TRACEMAP_OPENAI_API_KEY` or `OPENAI_API_KEY` when selected via
 * `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai`.
 */
export const realOpenAiAnswerGraphProvider: AnswerGraphProvider = {
  id: "openai",
  async generateAnswerGraph(
    input: GenerateAnswerGraphInput,
  ): Promise<GenerateAnswerGraphResult> {
    const { apiKey, model, timeoutMs } = getOpenAiConfig();

    if (!apiKey) {
      return {
        kind: "failure",
        errorMessage:
          "OpenAI API key is not configured. Set TRACEMAP_OPENAI_API_KEY (or OPENAI_API_KEY) to use the openai answer-graph provider.",
      };
    }

    const client = new OpenAI({
      apiKey,
      timeout: timeoutMs,
      maxRetries: 0,
    });

    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: [
              "You produce TraceMap answer graphs as JSON matching the given schema.",
              "When sufficient_grounding is true: include at least two distinct sources, each with a real public http or https URL you could verify (well-known references, standards, documentation, or authoritative pages).",
              "Do not invent URLs. If you cannot meet that bar, set sufficient_grounding to false (the run will fail — do not add fake links).",
              "Every claim must list supported_by_source_ids referencing sources[].id values.",
              "Separate 'cannot answer from sources' (sufficient_grounding false) from 'answer with caveats' (sufficient_grounding true, use alert.warning for limitations).",
            ].join(" "),
          },
          {
            role: "user",
            content: `Question:\n${input.question}\n\nReturn JSON per schema.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "trace_map_answer_graph",
            description: "Minimal answer graph slice for TraceMap persistence.",
            schema: OPENAI_STRUCTURED_SCHEMA as unknown as Record<string, unknown>,
            strict: true,
          },
        },
      });

      const raw = completion.choices[0]?.message?.content ?? undefined;
      if (!raw) {
        return {
          kind: "failure",
          errorMessage: "OpenAI returned an empty completion.",
        };
      }

      let parsed: StructuredAnswerPayload;
      try {
        parsed = JSON.parse(raw) as StructuredAnswerPayload;
      } catch (cause) {
        return {
          kind: "failure",
          errorMessage: "OpenAI returned invalid JSON in the completion.",
          cause,
        };
      }

      const validated = validateStructuredAnswerPayload(parsed);
      if (validated.kind === "failure") {
        return validated;
      }

      const normalizedUrls = validated.normalizedSources.map((s) => s.url);

      return buildGraphAndPayload(input.question, parsed, normalizedUrls, model);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "OpenAI answer graph generation failed.";
      return {
        kind: "failure",
        errorMessage: message,
        cause,
      };
    }
  },
};
