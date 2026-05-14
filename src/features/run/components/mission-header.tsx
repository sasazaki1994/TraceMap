type MissionHeaderProps = {
  researchTopic: string;
  answerTitle: string | null;
  runStatus?: "queued" | "processing" | "completed" | "failed";
  generatedAt?: string | null;
  runStatusBanner?: string | null;
};

export function MissionHeader({
  researchTopic,
  answerTitle,
  runStatus,
  generatedAt,
  runStatusBanner,
}: MissionHeaderProps) {
  const statusLabel = runStatus ? runStatus.toUpperCase() : "UNKNOWN";
  return (
    <section className="mission-header" data-testid="mission-header">
      <div className="eyebrow">Investigation Mission</div>
      <div className="run-question">
        <div className="run-question-label">Research topic</div>
        <p data-testid="mission-topic">{researchTopic}</p>
      </div>
      <p className="muted" style={{ marginTop: "0.5rem" }} data-testid="mission-status">
        Run status: {statusLabel}
      </p>
      {generatedAt ? (
        <p className="muted" style={{ marginTop: "0.25rem" }} data-testid="mission-generated-at">
          Generated at: {generatedAt}
        </p>
      ) : null}
      {runStatusBanner ? (
        <p
          className="muted"
          data-testid="run-status-banner"
          style={{ marginTop: "0.75rem" }}
        >
          {runStatusBanner}
        </p>
      ) : null}
      {answerTitle ? <h2>{answerTitle}</h2> : <h2>Executive Summary</h2>}
    </section>
  );
}
