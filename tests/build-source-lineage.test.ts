import { describe, expect, it } from "vitest";

import { buildSourceLineage } from "@/features/run/lib/build-source-lineage";
import type { RunSourceView } from "@/features/run/components/run-result-view";
import type { RunEvidenceClaim } from "@/types/run-evidence";

const sources: RunSourceView[] = [
  {
    id: "src-primary",
    label: "Official report",
    url: "https://example.com/report",
    excerpt: "Official excerpt.",
    sourceType: "web",
    publishedAt: "2025-01-01T00:00:00.000Z",
    verificationStatus: "verified",
    checkedAt: "2026-01-01T00:00:00.000Z",
    httpStatus: 200,
    finalUrl: "https://example.com/report",
    contentType: "text/html",
  },
  {
    id: "src-note",
    label: "Internal note",
    url: null,
    excerpt: null,
    sourceType: "note",
    publishedAt: null,
  },
];

const claims: RunEvidenceClaim[] = [
  {
    id: "claim-1",
    summary: "Claim one",
    graphNodeId: "node_claim_0",
    supportingSourceIds: ["src-primary", "src-note"],
    supports: [
      {
        sourceId: "src-primary",
        sourceLabel: "Official report",
        supportKind: "direct",
        isPrimarySource: true,
        supportingQuote: "Official excerpt.",
        contradictionNote: null,
      },
      {
        sourceId: "src-note",
        sourceLabel: "Internal note",
        supportKind: "indirect",
        isPrimarySource: false,
        supportingQuote: null,
        contradictionNote: null,
      },
    ],
    confidence: null,
    counterpoints: [],
    propagationSteps: [],
    lensScore: 0,
    alerts: [],
  },
];

describe("buildSourceLineage", () => {
  it("derives source lineage lite from sources and claim supports", () => {
    const lineage = buildSourceLineage({ sources, evidenceClaims: claims });

    expect(lineage).toHaveLength(2);
    expect(lineage[0]).toEqual(
      expect.objectContaining({
        sourceId: "src-primary",
        label: "Official report",
        sourceType: "web",
        publishedAt: "2025-01-01T00:00:00.000Z",
        isPrimarySource: true,
        linkedClaimCount: 1,
        verificationStatus: "verified",
        checkedAt: "2026-01-01T00:00:00.000Z",
        httpStatus: 200,
        finalUrl: "https://example.com/report",
        contentType: "text/html",
      }),
    );
    expect(lineage[0]?.lineageLabel).toContain("Primary evidence or official source");
    expect(lineage[0]?.lineageLabel).toContain("Web source");
    expect(lineage[1]?.lineageLabel).toContain("publication date unknown");
    expect(lineage[1]).toEqual(
      expect.objectContaining({
        sourceId: "src-note",
        label: "Internal note",
        publishedAt: null,
      }),
    );
  });

  it("does not mark sources as primary when no claim support proves it", () => {
    const lineage = buildSourceLineage({
      sources: [sources[0]!],
      evidenceClaims: [],
    });

    expect(lineage[0]).toEqual(
      expect.objectContaining({
        sourceId: "src-primary",
        isPrimarySource: false,
        linkedClaimCount: 0,
      }),
    );
    expect(lineage[0]?.lineageLabel).toContain("Supporting context");
  });

  it("does not label unknown verification state as verified", () => {
    const lineage = buildSourceLineage({
      sources: [sources[1]!],
      evidenceClaims: [],
    });

    expect(lineage[0]?.lineageLabel.toLowerCase()).not.toContain("verified");
    expect(lineage[0]?.lineageLabel).toContain("publication date unknown");
  });

  it("falls back safely for unknown source types", () => {
    const lineage = buildSourceLineage({
      sources: [
        {
          id: "src-unknown",
          label: "Unclassified source",
          sourceType: "rss" as "web",
          publishedAt: undefined,
        },
      ],
      evidenceClaims: [],
    });

    expect(lineage[0]).toEqual(
      expect.objectContaining({
        sourceId: "src-unknown",
        label: "Unclassified source",
        sourceType: "rss",
        publishedAt: null,
        isPrimarySource: false,
        linkedClaimCount: 0,
      }),
    );
    expect(lineage[0]?.lineageLabel).toContain("Unknown source type");
    expect(lineage[0]?.lineageLabel).toContain("publication date unknown");
  });
});
