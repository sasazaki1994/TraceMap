import type { InvestigationUnknown, SourceLineageLite } from "@/types/investigation";
import type { SourceQualitySignal } from "@/types/source-quality";

export type SourceSupportDisplayKind =
  | "direct"
  | "indirect"
  | "context"
  | "weak"
  | "contradiction"
  | "unknown";

export type SourceSupportedClaim = {
  claimId: string;
  claimText: string;
  supportKind: SourceSupportDisplayKind;
  rawSupportKind: string;
  supportingQuote?: string | null;
  contradictionNote?: string | null;
  isPrimarySource: boolean;
  warnings: string[];
};

export type SourceDetailDrilldown = {
  sourceId: string;
  title: string;
  url?: string | null;
  sourceType?: string | null;
  publishedAt?: string | null;
  sourceQuality?: SourceQualitySignal | null;
  lineage?: SourceLineageLite | null;
  isPrimaryLike: boolean;
  supportedClaims: SourceSupportedClaim[];
  relatedUnknowns: InvestigationUnknown[];
};
