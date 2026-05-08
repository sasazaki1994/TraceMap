import { MarkdownExportActions } from "./markdown-export-actions";
import { safeMarkdownFileName } from "../lib/safe-markdown-file-name";

type CompanyResearchReportPanelProps = {
  markdown: string;
};

export function CompanyResearchReportPanel({ markdown }: CompanyResearchReportPanelProps) {
  return (
    <section className="investigation-panel" data-testid="company-research-report-panel">
      <div className="run-question-label">Company Research Report</div>
      <h3>Markdown preview</h3>
      <MarkdownExportActions
        markdown={markdown}
        fileName={safeMarkdownFileName("company-research-report")}
        copyButtonTestId="company-report-copy-button"
        downloadButtonTestId="company-report-download-button"
        copyStatusTestId="company-report-copy-status"
      />
      <pre className="briefing-report-markdown" data-testid="company-research-report-markdown">
        {markdown}
      </pre>
    </section>
  );
}
