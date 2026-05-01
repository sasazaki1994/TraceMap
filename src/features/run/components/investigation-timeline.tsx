const INVESTIGATION_STEPS = [
  "COLLECTING SOURCES",
  "EXTRACTING CLAIMS",
  "LINKING EVIDENCE",
  "DETECTING UNKNOWNS",
  "BUILDING REPORT",
] as const;

export function InvestigationTimeline() {
  return (
    <section className="investigation-panel" data-testid="investigation-timeline">
      <h3 className="run-question-label">Investigation timeline</h3>
      <ol className="investigation-timeline-list">
        {INVESTIGATION_STEPS.map((step) => (
          <li key={step} data-testid="investigation-step">
            <span className="investigation-step-dot" aria-hidden="true" />
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
