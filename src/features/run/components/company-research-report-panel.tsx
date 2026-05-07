type CompanyResearchReportPanelProps = {
  markdown: string;
};

export function CompanyResearchReportPanel({ markdown }: CompanyResearchReportPanelProps) {
  return (
    <section className="investigation-panel" data-testid="company-research-report-panel">
      <div className="run-question-label">Company Research Report</div>
      <h3>Markdown preview</h3>
      <pre className="briefing-report-markdown" data-testid="company-research-report-markdown">
        {markdown}
      </pre>
    </section>
  );
}
