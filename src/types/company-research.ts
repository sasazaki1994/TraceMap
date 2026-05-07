import type { InvestigationUnknown, SourceLineageLite } from "@/types/investigation";

export type CompanyResearchReportInput = {
  topic: string;
  answerContent: string;
  claims: Array<{ id: string; text: string; confidence?: string | null }>;
  sources: Array<{
    id: string;
    title: string;
    url?: string | null;
    sourceType?: string | null;
    publishedAt?: string | null;
  }>;
  unknowns: InvestigationUnknown[];
  sourceLineage?: SourceLineageLite[];
};

export type CompanyResearchReport = {
  markdown: string;
  hasInvestmentDisclaimer: boolean;
};
