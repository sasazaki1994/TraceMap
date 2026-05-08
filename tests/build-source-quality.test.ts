import { describe, expect, it } from "vitest";

import { buildSourceQuality } from "@/features/run/lib/build-source-quality";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const now = new Date("2026-05-08T00:00:00Z");

function claimForSource(sourceId: string, overrides?: Partial<RunEvidenceClaim["supports"][number]>): RunEvidenceClaim {
  return {
    id: `c-${sourceId}`,
    summary: "claim",
    graphNodeId: null,
    supportingSourceIds: [sourceId],
    lensScore: 0,
    supports: [
      {
        sourceId,
        sourceLabel: sourceId,
        supportKind: "direct",
        isPrimarySource: true,
        supportingQuote: "quote",
        contradictionNote: null,
        ...overrides,
      },
    ],
    confidence: null,
    counterpoints: [],
    propagationSteps: [],
    alerts: [],
  };
}

describe("buildSourceQuality", () => {
  it("marks verified source as reachable and strong when fresh primary with quote", () => {
    const [signal] = buildSourceQuality({
      now,
      evidenceClaims: [claimForSource("s1")],
      sources: [
        {
          id: "s1",
          label: "S1",
          url: null,
          excerpt: null,
          sourceType: "web",
          verificationStatus: "verified",
          publishedAt: "2026-05-01T00:00:00Z",
        },
      ],
    });

    expect(signal?.reachabilityStatus).toBe("reachable");
    expect(signal?.qualityLevel).toBe("strong");
  });

  it("marks 2xx source as reachable", () => {
    const [signal] = buildSourceQuality({
      now,
      evidenceClaims: [claimForSource("s2")],
      sources: [{ id: "s2", label: "S2", url: null, excerpt: null, sourceType: "web", httpStatus: 200 }],
    });
    expect(signal?.reachabilityStatus).toBe("reachable");
  });

  it("marks unreachable and invalid as weak", () => {
    const unreachable = buildSourceQuality({
      now,
      evidenceClaims: [claimForSource("s3")],
      sources: [{ id: "s3", label: "S3", url: null, excerpt: null, sourceType: "web", verificationStatus: "unreachable" }],
    })[0];
    const invalid = buildSourceQuality({
      now,
      evidenceClaims: [claimForSource("s4")],
      sources: [{ id: "s4", label: "S4", url: null, excerpt: null, sourceType: "web", verificationStatus: "invalid" }],
    })[0];

    expect(unreachable?.qualityLevel).toBe("weak");
    expect(invalid?.qualityLevel).toBe("weak");
  });

  it("marks missing date as freshness unknown", () => {
    const [signal] = buildSourceQuality({
      now,
      evidenceClaims: [claimForSource("s5")],
      sources: [{ id: "s5", label: "S5", url: null, excerpt: null, sourceType: "web", verificationStatus: "verified" }],
    });

    expect(signal?.freshnessStatus).toBe("unknown");
  });

  it("marks old date as stale", () => {
    const [signal] = buildSourceQuality({
      now,
      evidenceClaims: [claimForSource("s6")],
      sources: [{ id: "s6", label: "S6", url: null, excerpt: null, sourceType: "web", verificationStatus: "verified", publishedAt: "2025-01-01T00:00:00Z" }],
    });

    expect(signal?.freshnessStatus).toBe("stale");
    expect(signal?.qualityLevel).toBe("weak");
  });

  it("marks unchecked source as limited", () => {
    const [signal] = buildSourceQuality({
      now,
      evidenceClaims: [claimForSource("s7")],
      sources: [{ id: "s7", label: "S7", url: null, excerpt: null, sourceType: "web", verificationStatus: "unverified", publishedAt: "2026-05-01T00:00:00Z" }],
    });

    expect(signal?.reachabilityStatus).toBe("unchecked");
    expect(signal?.qualityLevel).toBe("limited");
  });
});
