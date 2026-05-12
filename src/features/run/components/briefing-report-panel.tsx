"use client";

import { useMemo, useState } from "react";
import { MarkdownExportActions } from "./markdown-export-actions";
import { safeMarkdownFileName } from "../lib/safe-markdown-file-name";
import { buildReportTemplate, type ReportTemplate } from "../lib/build-report-template";

type BriefingReportPanelProps = {
  runId?: string;
  briefingMarkdown: string;
  companyResearchMarkdown: string;
};

const reportTemplates: ReportTemplate[] = ["briefing", "company_research", "competitive_intelligence"];

function isReportTemplate(value: string): value is ReportTemplate {
  return reportTemplates.includes(value as ReportTemplate);
}

export function BriefingReportPanel({ runId, briefingMarkdown, companyResearchMarkdown }: BriefingReportPanelProps) {
  const [template, setTemplate] = useState<ReportTemplate>("briefing");
  const markdown = useMemo(() => {
    if (template === "briefing") return briefingMarkdown;
    if (template === "company_research") return companyResearchMarkdown;
    const skeleton = buildReportTemplate("competitive_intelligence").join("\n\n");
    return `${skeleton}\n\n## Evidence Strength\n- Evidence quality is derived from the current run graph.`;
  }, [briefingMarkdown, companyResearchMarkdown, template]);

  return (
    <section className="investigation-panel" data-testid="briefing-report-panel">
      <div className="run-question-label">Briefing Report</div>
      <h3>Markdown preview</h3>
      <label htmlFor="report-template-select" className="source-list-item-meta">Report template</label>
      <select id="report-template-select" data-testid="report-template-select" value={template} onChange={(e) => { const val = (e.target as HTMLSelectElement).value; if (isReportTemplate(val)) setTemplate(val); }}>
        <option value="briefing">Briefing</option>
        <option value="company_research">Company Research</option>
        <option value="competitive_intelligence">Competitive Intelligence</option>
      </select>
      <MarkdownExportActions
        markdown={markdown}
        fileName={safeMarkdownFileName(`tracemap-report-${runId ?? "run"}`)}
        copyButtonTestId="copy-markdown-button"
        downloadButtonTestId="download-markdown-button"
        copyStatusTestId="briefing-report-copy-status"
      />
      <pre className="briefing-report-markdown" data-testid="briefing-report-markdown">{markdown}</pre>
    </section>
  );
}
