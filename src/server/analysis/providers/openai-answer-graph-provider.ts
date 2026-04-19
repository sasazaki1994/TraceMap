import OpenAI from "openai";

import type { AnswerGraphProvider } from "@/server/analysis/answer-graph-provider";
import { answerGraphJsonSchema, type AnswerGraphJson } from "@/types/answer-graph";
import type {
  GeneratedAnswerGraphPayload,
  GenerateAnswerGraphInput,
  GenerateAnswerGraphResult,
} from "@/types/answer-graph-generation";

const OPENAI_STRUCTURED_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
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
      description: "Short atomic claims that the answer rests on.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          summary: { type: "string" },
        },
        required: ["id", "summary"],
      },
    },
    sources: {
      type: "array",
      description: "References the answer cites; map to graph source nodes.",
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
            description:
              "Canonical URL when applicable; use empty string when unknown.",
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
    "answer_title",
    "answer_content",
    "claims",
    "sources",
    "counterpoint_summary",
    "alert",
  ],
} as const;

type StructuredAnswerPayload = {
  answer_title: string;
  answer_content: string;
  claims: { id: string; summary: string }[];
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

function buildGraphAndPayload(
  question: string,
  structured: StructuredAnswerPayload,
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

  const nodes: AnswerGraphJson["nodes"] = [
    { id: "node_question", kind: "question", label: preview },
    { id: "node_answer", kind: "answer", label: "Synthesis" },
    ...sourceNodes,
  ];

  const edges: AnswerGraphJson["edges"] = [
    { id: "edge_q_a", from: "node_question", to: "node_answer" },
    ...sourceNodes.map((n, i) => ({
      id: `edge_s${i}_a`,
      from: n.id,
      to: "node_answer",
      label: "supports" as const,
    })),
  ];

  const graph: AnswerGraphJson = { version: 1, nodes, edges };
  answerGraphJsonSchema.parse(graph);

  const claimSummary =
    structured.claims.length > 0
      ? structured.claims.map((c) => `• ${c.summary}`).join("\n")
      : structured.answer_content.slice(0, 400);

  const payload: GeneratedAnswerGraphPayload = {
    answer: {
      title: structured.answer_title,
      model: modelLabel,
      content: structured.answer_content,
      graphJson: graph,
    },
    sources: structured.sources.map((s) => ({
      label: s.label,
      sourceType: s.source_type,
      url: s.url.trim() ? s.url.trim() : null,
      excerpt: s.excerpt.trim() ? s.excerpt : null,
    })),
    evidence: {
      claim: {
        summary: claimSummary,
        graphNodeId: "node_answer",
      },
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

    let raw: string | undefined;
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: [
              "You produce TraceMap answer graphs as JSON matching the given schema.",
              "Ground the answer in generic knowledge; do not invent specific URLs.",
              "If you lack a real URL, set url to an empty string and keep excerpt substantive.",
              "Provide at least one source row with a meaningful excerpt.",
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

      raw = completion.choices[0]?.message?.content ?? undefined;
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

      if (!Array.isArray(parsed.sources) || parsed.sources.length === 0) {
        return {
          kind: "failure",
          errorMessage: "OpenAI structured output missing non-empty sources.",
          cause: parsed,
        };
      }

      return buildGraphAndPayload(input.question, parsed, model);
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
