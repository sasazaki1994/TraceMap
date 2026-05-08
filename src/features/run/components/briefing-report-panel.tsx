import { MarkdownExportActions } from "./markdown-export-actions";
import { safeMarkdownFileName } from "../lib/safe-markdown-file-name";

type BriefingReportPanelProps = {
  markdown: string;
};

export function BriefingReportPanel({ markdown }: BriefingReportPanelProps) {
  return (
    <section className="investigation-panel" data-testid="briefing-report-panel">
      <div className="run-question-label">Briefing Report</div>
      <h3>Markdown preview</h3>
      <MarkdownExportActions
        markdown={markdown}
        fileName={safeMarkdownFileName("briefing-report")}
        copyButtonTestId="briefing-report-copy-button"
        downloadButtonTestId="briefing-report-download-button"
        copyStatusTestId="briefing-report-copy-status"
      />
      <pre className="briefing-report-markdown" data-testid="briefing-report-markdown">
        {markdown}
      </pre>
    </section>
  );
}
