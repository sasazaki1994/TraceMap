"use client";

import { MarkdownExportActions } from "./markdown-export-actions";
import { safeMarkdownFileName } from "../lib/safe-markdown-file-name";

type BriefingReportPanelProps = {
  runId?: string;
  briefingMarkdown: string;
};

function fallbackFileName(runId?: string): string {
  if (runId) return safeMarkdownFileName(`tracemap-report-${runId}`);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return safeMarkdownFileName(`tracemap-report-${stamp}`);
}

export function BriefingReportPanel({ runId, briefingMarkdown }: BriefingReportPanelProps) {
  return (
    <section className="investigation-panel" data-testid="briefing-report-panel">
      <div className="run-question-label">Briefing Report</div>
      <h3>Markdown preview</h3>
      <MarkdownExportActions
        markdown={briefingMarkdown}
        fileName={fallbackFileName(runId)}
        copyButtonTestId="copy-markdown-button"
        downloadButtonTestId="download-markdown-button"
        copyStatusTestId="copy-markdown-status"
      />
      <pre className="briefing-report-markdown" data-testid="briefing-report-markdown">{briefingMarkdown}</pre>
    </section>
  );
}
