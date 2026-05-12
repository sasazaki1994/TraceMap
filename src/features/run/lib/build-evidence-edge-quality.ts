import type { RunEvidenceClaim, RunClaimSupport } from "@/types/run-evidence";

export type EvidenceSupportQuality = "direct" | "indirect" | "context" | "weak" | "contradiction" | "unknown";

export type EvidenceEdgeQuality = {
  claimId: string;
  sourceId: string;
  supportQuality: EvidenceSupportQuality;
  hasSupportingQuote: boolean;
  isPrimarySource: boolean;
  reasons: string[];
};

function classifySupport(support: RunClaimSupport): { quality: EvidenceSupportQuality; reasons: string[] } {
  const reasons: string[] = [];
  if (support.contradictionNote?.trim()) {
    reasons.push("Contradiction note is present.");
    return { quality: "contradiction", reasons };
  }
  const hasQuote = Boolean(support.supportingQuote?.trim());
  if (support.supportKind === "direct" && hasQuote) {
    reasons.push("Direct support with supporting quote.");
    return { quality: "direct", reasons };
  }
  if (support.supportKind === "direct" && !hasQuote) {
    reasons.push("Direct support lacks quote.");
    return { quality: "weak", reasons };
  }
  if (support.supportKind === "indirect") {
    reasons.push(hasQuote ? "Indirect support with quote." : "Indirect support without quote.");
    return { quality: hasQuote ? "indirect" : "weak", reasons };
  }
  if (support.supportKind === "supplemental") {
    reasons.push("Supplemental context support.");
    return { quality: "context", reasons };
  }
  return { quality: "unknown", reasons: ["Support quality could not be determined."] };
}

export function buildEvidenceEdgeQuality(claims: RunEvidenceClaim[]): EvidenceEdgeQuality[] {
  return claims.flatMap((claim) =>
    claim.supports.map((support) => {
      const classified = classifySupport(support);
      return {
        claimId: claim.id,
        sourceId: support.sourceId,
        supportQuality: classified.quality,
        hasSupportingQuote: Boolean(support.supportingQuote?.trim()),
        isPrimarySource: support.isPrimarySource,
        reasons: classified.reasons,
      };
    }),
  );
}
