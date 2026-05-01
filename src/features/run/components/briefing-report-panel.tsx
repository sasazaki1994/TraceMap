type BriefingReportPanelProps = {
  markdown: string;
};

export function BriefingReportPanel({ markdown }: BriefingReportPanelProps) {
  return (
    <section className="investigation-panel" data-testid="briefing-report-panel">
      <div className="run-question-label">Briefing Report</div>
      <h3>Markdown preview</h3>
      <pre className="briefing-report-markdown" data-testid="briefing-report-markdown">
        {markdown}
      </pre>
    </section>
  );
}
