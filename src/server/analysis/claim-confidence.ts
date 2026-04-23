import type { AlertLevel, ClaimConfidenceLevel, ClaimRecencyStatus } from "@prisma/client";

import type {
  GeneratedEvidenceClaimInput,
  GeneratedSourceSnapshot,
} from "@/types/answer-graph-generation";

type EvidenceAlert = {
  level: AlertLevel;
  message: string;
};

export type ClaimConfidenceBreakdown = {
  score: number;
  level: ClaimConfidenceLevel;
  summary: string;
  supportCount: number;
  hasPrimarySource: boolean;
  independentSourceCount: number;
  hasSupportingQuote: boolean;
  recencyStatus: ClaimRecencyStatus;
  hasContradiction: boolean;
};

type ClaimSupportForEvaluation = NonNullable<
  GeneratedEvidenceClaimInput["supports"]
>[number];

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function toConfidenceLevel(score: number): ClaimConfidenceLevel {
  if (score >= 80) {
    return "high";
  }
  if (score >= 60) {
    return "medium";
  }
  if (score >= 35) {
    return "low";
  }
  return "insufficient";
}

function recencyFromPublishedDates(
  supports: ClaimSupportForEvaluation[],
  sourceByPlaceholderId: Map<string, GeneratedSourceSnapshot>,
): ClaimRecencyStatus {
  const publishedDates = supports
    .map((support) => sourceByPlaceholderId.get(support.sourcePlaceholderId)?.publishedAt ?? null)
    .filter((publishedAt): publishedAt is Date => publishedAt !== null);

  if (publishedDates.length === 0) {
    return "unknown";
  }

  const newestTimestamp = publishedDates.reduce<number | null>((latest, value) => {
    const timestamp = value.getTime();
    if (Number.isNaN(timestamp)) {
      return latest;
    }
    return latest === null ? timestamp : Math.max(latest, timestamp);
  }, null);

  if (newestTimestamp === null) {
    return "unknown";
  }

  const ageMs = Date.now() - newestTimestamp;
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  return ageMs <= oneYearMs ? "current" : "stale";
}

function countIndependentSources(
  supports: ClaimSupportForEvaluation[],
  sourceByPlaceholderId: Map<string, GeneratedSourceSnapshot>,
): number {
  const keys = new Set<string>();

  for (const support of supports) {
    const source = sourceByPlaceholderId.get(support.sourcePlaceholderId);
    if (!source) {
      continue;
    }

    if (source.url) {
      try {
        const host = new URL(source.url).hostname.trim().toLowerCase();
        if (host) {
          keys.add(`host:${host}`);
          continue;
        }
      } catch {
        // Fall through to placeholder identity.
      }
    }

    keys.add(`source:${support.sourcePlaceholderId}`);
  }

  return keys.size;
}

function buildSummary(params: {
  supportCount: number;
  hasPrimarySource: boolean;
  independentSourceCount: number;
  hasSupportingQuote: boolean;
  recencyStatus: ClaimRecencyStatus;
  hasContradiction: boolean;
  level: ClaimConfidenceLevel;
}): string {
  const parts: string[] = [];

  if (params.supportCount === 0) {
    parts.push("No supporting sources are linked to this claim.");
  }
  parts.push(
    params.hasPrimarySource ? "Primary source present." : "Primary source missing.",
  );
  parts.push(`Independent sources: ${params.independentSourceCount}.`);
  parts.push(
    params.hasSupportingQuote
      ? "Quoted support is available."
      : "No supporting quote is available.",
  );
  parts.push(
    params.recencyStatus === "current"
      ? "Support is recent."
      : params.recencyStatus === "stale"
        ? "Support may be stale."
        : "Support recency is unknown.",
  );
  if (params.hasContradiction) {
    parts.push("Contradictory evidence is present.");
  }
  parts.push(`Confidence level: ${params.level}.`);

  return parts.join(" ");
}

type ClaimSupportEvidence = {
  url: string | null;
  publishedAt: Date | null;
  supportKind: ClaimSupportForEvaluation["supportKind"];
  isPrimarySource: boolean;
  supportingQuote: string | null;
  contradictionNote: string | null;
};

export function computeClaimConfidence(
  supports: ClaimSupportEvidence[],
  _sourcesOrNow?: GeneratedSourceSnapshot[] | Date,
  now: Date = new Date(),
): ClaimConfidenceBreakdown {
  const effectiveNow =
    _sourcesOrNow instanceof Date ? _sourcesOrNow : now;
  const normalizedSupports: ClaimSupportForEvaluation[] = supports.map((support, index) => ({
    sourcePlaceholderId: `__support_${index}__`,
    supportKind: support.supportKind,
    isPrimarySource: support.isPrimarySource,
    supportingQuote: support.supportingQuote,
    contradictionNote: support.contradictionNote,
  }));
  const sourceByPlaceholderId = new Map(
    supports.map((support, index) => [
      `__support_${index}__`,
      {
        label: `Support ${index + 1}`,
        sourceType: "web" as const,
        url: support.url,
        excerpt: support.supportingQuote,
        publishedAt: support.publishedAt,
      } satisfies GeneratedSourceSnapshot,
    ]),
  );

  const hasPrimarySource = normalizedSupports.some((support) => support.isPrimarySource);
  const independentSourceCount = countIndependentSources(
    normalizedSupports,
    sourceByPlaceholderId,
  );
  const hasSupportingQuote = normalizedSupports.some(
    (support) => support.supportingQuote?.trim().length,
  );
  const recencyStatus = (() => {
    const originalNow = Date.now;
    try {
      Date.now = () => effectiveNow.getTime();
      return recencyFromPublishedDates(normalizedSupports, sourceByPlaceholderId);
    } finally {
      Date.now = originalNow;
    }
  })();
  const hasContradiction = normalizedSupports.some(
    (support) => support.contradictionNote?.trim().length,
  );

  let score = supports.length === 0 ? 0 : 35;
  if (hasPrimarySource) {
    score += 20;
  }
  if (independentSourceCount >= 2) {
    score += 15;
  }
  if (independentSourceCount >= 3) {
    score += 10;
  }
  if (hasSupportingQuote) {
    score += 15;
  }
  if (recencyStatus === "current") {
    score += 10;
  } else if (recencyStatus === "unknown") {
    score -= 10;
  } else if (recencyStatus === "stale") {
    score -= 20;
  }
  if (hasContradiction) {
    score -= 25;
  }

  const clampedScore = clampScore(score);
  const level = toConfidenceLevel(clampedScore);

  return {
    score: clampedScore,
    level,
    summary: buildSummary({
      supportCount: supports.length,
      hasPrimarySource,
      independentSourceCount,
      hasSupportingQuote,
      recencyStatus,
      hasContradiction,
      level,
    }),
    supportCount: supports.length,
    hasPrimarySource,
    independentSourceCount,
    hasSupportingQuote,
    recencyStatus,
    hasContradiction,
  };
}

export function evaluateClaimConfidence(params: {
  claim: GeneratedEvidenceClaimInput;
  sources: GeneratedSourceSnapshot[];
}): ClaimConfidenceBreakdown {
  const supports =
    params.claim.supports?.map((support) => {
      const sourceIndex = Number.parseInt(
        support.sourcePlaceholderId.replace("__src_", "").replace("__", ""),
        10,
      );
      const source = Number.isNaN(sourceIndex) ? undefined : params.sources[sourceIndex];
      return {
        url: source?.url ?? null,
        publishedAt: source?.publishedAt ?? null,
        supportKind: support.supportKind,
        isPrimarySource: support.isPrimarySource === true,
        supportingQuote: support.supportingQuote ?? null,
        contradictionNote: support.contradictionNote ?? null,
      };
    }) ?? [];

  return computeClaimConfidence(supports);
}

export function buildClaimEvidenceAlerts(
  confidence: ClaimConfidenceBreakdown,
  supportCount: number = confidence.supportCount,
): EvidenceAlert[] {
  return buildDerivedClaimAlerts({
    claim: {
      summary: "",
      graphNodeId: null,
      supportedSourcePlaceholderIds: [],
      supports: Array.from({ length: supportCount }, () => ({
        sourcePlaceholderId: "__support__",
        supportKind: "direct",
        isPrimarySource: confidence.hasPrimarySource,
      })),
    },
    confidence,
  });
}

export function buildDerivedClaimAlerts(params: {
  claim: GeneratedEvidenceClaimInput;
  confidence: ClaimConfidenceBreakdown;
}): EvidenceAlert[] {
  const supports = params.claim.supports ?? [];
  const alerts: EvidenceAlert[] = [];

  if (supports.length === 0) {
    alerts.push({
      level: "error",
      message: "No supporting sources are linked to this claim.",
    });
  }
  if (!params.confidence.hasPrimarySource) {
    alerts.push({
      level: "warning",
      message: "No primary source is linked to this claim.",
    });
  }
  if (supports.length === 1) {
    alerts.push({
      level: "warning",
      message: "This claim is supported by only one source.",
    });
  }
  if (!params.confidence.hasSupportingQuote) {
    alerts.push({
      level: "warning",
      message: "No supporting quote or cited passage is available.",
    });
  }
  if (params.confidence.recencyStatus === "stale") {
    alerts.push({
      level: "warning",
      message: "Supporting sources may be stale.",
    });
  }
  if (params.confidence.recencyStatus === "unknown") {
    alerts.push({
      level: "warning",
      message: "Supporting sources do not include a known publication date.",
    });
  }
  if (params.confidence.hasContradiction) {
    alerts.push({
      level: "warning",
      message: "Supporting sources contain contradictory or counter evidence.",
    });
  }

  return alerts;
}
