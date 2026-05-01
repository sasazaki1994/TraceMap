type MissionHeaderProps = {
  researchTopic: string;
  answerTitle: string | null;
  runStatusBanner?: string | null;
};

export function MissionHeader({
  researchTopic,
  answerTitle,
  runStatusBanner,
}: MissionHeaderProps) {
  return (
    <section className="mission-header" data-testid="mission-header">
      <div className="eyebrow">Investigation Mission</div>
      <div className="run-question">
        <div className="run-question-label">Research topic</div>
        <p data-testid="mission-topic">{researchTopic}</p>
      </div>
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
