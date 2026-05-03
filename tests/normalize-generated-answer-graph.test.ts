import { describe, expect, it } from "vitest";

import { INVESTIGATION_LIMITS } from "@/server/analysis/investigation-limits";
import {
  normalizeGeneratedAnswerGraph,
  type StructuredAnswerPayload,
} from "@/server/analysis/normalize-generated-answer-graph";

function longText(length: number): string {
  return "x".repeat(length);
}

function source(id: string) {
  return {
    id,
    label: ` ${id} label `,
    source_type: "web" as const,
    url: ` https://example.com/${id} `,
    excerpt: ` ${longText(INVESTIGATION_LIMITS.maxSourceExcerptChars + 25)} `,
  };
}

function claim(id: string, supportedBy: string[]) {
  return {
    id,
    summary: ` ${longText(INVESTIGATION_LIMITS.maxClaimSummaryChars + 25)} `,
    supported_by_source_ids: supportedBy,
    counterpoints: [
      { summary: " cp1 ", relationship_kind: "contradiction" as const },
      { summary: " cp2 ", relationship_kind: "different_premise" as const },
      { summary: " cp3 ", relationship_kind: "temporal_mismatch" as const },
    ],
    alerts: [
      { level: "info" as const, message: " alert1 " },
      { level: "warning" as const, message: " alert2 " },
      { level: "error" as const, message: " alert3 " },
    ],
    propagation_chain: [
      {
        step_kind: "source" as const,
        source_id: supportedBy[0],
        label: " step0 ",
      },
      {
        step_kind: "evidence_snippet" as const,
        source_id: supportedBy[0],
        label: " step1 ",
        content: " detail ",
      },
      { step_kind: "source_interpretation" as const, label: " step2 " },
      { step_kind: "claim" as const, label: " step3 " },
      { step_kind: "answer_segment" as const, label: " step4 " },
      { step_kind: "answer_segment" as const, label: " step5 " },
    ],
  };
}

function payload(overrides: Partial<StructuredAnswerPayload> = {}): StructuredAnswerPayload {
  return {
    sufficient_grounding: true,
    answer_title: " Title ",
    answer_content: ` ${longText(INVESTIGATION_LIMITS.maxAnswerContentChars + 25)} `,
    sources: [source("s1"), source("s2")],
    claims: [claim("c1", ["s1"])],
    ...overrides,
  };
}

describe("normalizeGeneratedAnswerGraph", () => {
  it("caps sources and claims before persistence", () => {
    const sources = Array.from({ length: INVESTIGATION_LIMITS.maxSources + 3 }, (_, i) =>
      source(`s${i + 1}`),
    );
    const claims = Array.from({ length: INVESTIGATION_LIMITS.maxClaims + 3 }, (_, i) =>
      claim(`c${i + 1}`, ["s1"]),
    );

    const result = normalizeGeneratedAnswerGraph(payload({ sources, claims }));

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }
    expect(result.payload.sources).toHaveLength(INVESTIGATION_LIMITS.maxSources);
    expect(result.payload.claims).toHaveLength(INVESTIGATION_LIMITS.maxClaims);
  });

  it("trims answer content, source excerpts, and claim summaries", () => {
    const result = normalizeGeneratedAnswerGraph(payload());

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }
    expect(result.payload.answer_title).toBe("Title");
    expect(result.payload.answer_content).toHaveLength(
      INVESTIGATION_LIMITS.maxAnswerContentChars,
    );
    expect(result.payload.sources[0]?.label).toBe("s1 label");
    expect(result.payload.sources[0]?.excerpt).toHaveLength(
      INVESTIGATION_LIMITS.maxSourceExcerptChars,
    );
    expect(result.payload.claims[0]?.summary).toHaveLength(
      INVESTIGATION_LIMITS.maxClaimSummaryChars,
    );
  });

  it("caps counterpoints, alerts, and propagation steps per claim", () => {
    const result = normalizeGeneratedAnswerGraph(payload());

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }
    const normalizedClaim = result.payload.claims[0];
    expect(normalizedClaim?.counterpoints).toHaveLength(
      INVESTIGATION_LIMITS.maxCounterpointsPerClaim,
    );
    expect(normalizedClaim?.alerts).toHaveLength(INVESTIGATION_LIMITS.maxAlertsPerClaim);
    expect(normalizedClaim?.propagation_chain).toHaveLength(
      INVESTIGATION_LIMITS.maxPropagationStepsPerClaim,
    );
    expect(normalizedClaim?.alerts?.[0]?.message).toBe("alert1");
    expect(normalizedClaim?.propagation_chain?.[0]?.label).toBe("step0");
  });

  it("drops claims that only reference sources removed by the source cap", () => {
    const sources = Array.from({ length: INVESTIGATION_LIMITS.maxSources + 1 }, (_, i) =>
      source(`s${i + 1}`),
    );
    const result = normalizeGeneratedAnswerGraph(
      payload({
        sources,
        claims: [claim("kept", ["s1"]), claim("dropped", [`s${sources.length}`])],
      }),
    );

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") {
      return;
    }
    expect(result.payload.claims.map((item) => item.id)).toEqual(["kept"]);
    expect(result.droppedClaimIds).toEqual(["dropped"]);
  });

  it("fails when a claim references an unknown source id", () => {
    const result = normalizeGeneratedAnswerGraph(payload({ claims: [claim("c1", ["missing"])] }));

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("unknown_source_reference");
      expect(result.errorMessage).toContain("missing");
    }
  });

  it("fails when sufficient grounding is false", () => {
    const result = normalizeGeneratedAnswerGraph(payload({ sufficient_grounding: false }));

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("insufficient_grounding");
    }
  });

  it("fails when fewer than two sources remain", () => {
    const result = normalizeGeneratedAnswerGraph(
      payload({
        sources: [source("s1")],
        claims: [claim("c1", ["s1"])],
      }),
    );

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("too_few_sources");
    }
  });

  it("fails when no claims are returned", () => {
    const result = normalizeGeneratedAnswerGraph(payload({ claims: [] }));

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("no_claims");
    }
  });

  it("fails when limits invalidate all claim evidence", () => {
    const sources = Array.from({ length: INVESTIGATION_LIMITS.maxSources + 1 }, (_, i) =>
      source(`s${i + 1}`),
    );
    const result = normalizeGeneratedAnswerGraph(
      payload({
        sources,
        claims: [claim("only-dropped", [`s${sources.length}`])],
      }),
    );

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("output_limit_invalidated_evidence");
    }
  });
});
