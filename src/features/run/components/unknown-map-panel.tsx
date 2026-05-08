import type { InvestigationUnknown } from "@/types/investigation";

type UnknownMapPanelProps = {
  unknowns: InvestigationUnknown[];
};

export function UnknownMapPanel({ unknowns }: UnknownMapPanelProps) {
  return (
    <section
      className="investigation-panel-block"
      data-testid="unknown-map-panel"
    >
      <div className="run-question-label">Unknown Map</div>
      <h3>Unresolved questions and gaps</h3>
      {unknowns.length > 0 ? (
        <ul className="investigation-list">
          {unknowns.map((unknown) => (
            <li
              key={unknown.id}
              className={`unknown-map-item unknown-map-item--${unknown.severity}`}
              data-testid="unknown-map-item"
            >
              <div className="claim-support-header">
                <span className="claim-support-kind">
                  {unknown.severity.toUpperCase()}
                </span>
                <span className="muted">{unknown.reason}</span>
              </div>
              <p className="source-list-item-title">{unknown.text}</p>
              <p className="muted" style={{ marginTop: "6px" }}>
                Next: {unknown.suggestedNextAction}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No unresolved investigation gaps were detected in this run.</p>
      )}
    </section>
  );
}
