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
      <div data-testid="copy-markdown-button"><div data-testid="download-markdown-button"><MarkdownExportActions
        markdown={markdown}
        fileName={safeMarkdownFileName("briefing-report")}
        copyButtonTestId="copy-markdown-button"
        downloadButtonTestId="download-markdown-button"
        copyStatusTestId="briefing-report-copy-status"
        copyButtonLegacyTestId="briefing-report-copy-button"
        downloadButtonLegacyTestId="briefing-report-download-button"
      />
      </div></div>
      <pre className="briefing-report-markdown" data-testid="briefing-report-markdown">
        {markdown}
      </pre>
    </section>
  );
}
