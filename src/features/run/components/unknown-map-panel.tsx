import type { InvestigationUnknown } from "@/types/investigation";

type UnknownMapPanelProps = {
  unknowns: InvestigationUnknown[];
};

export function UnknownMapPanel({ unknowns }: UnknownMapPanelProps) {
  return (
    <section className="investigation-panel-block" data-testid="unknown-map-panel">
      <div className="run-question-label">Unknown Map</div>
      <h3>Unresolved questions and gaps</h3>
      {unknowns.length > 0 ? (
        <ul className="investigation-list">
          {unknowns.map((unknown) => (
            <li key={unknown.id} className={`unknown-map-item unknown-map-item--${unknown.severity}`} data-testid="unknown-map-item">
              <p className="claim-support-kind"><span data-testid="unknown-severity">{unknown.severity.toUpperCase()}</span> · <span data-testid="unknown-category">{unknown.category.toUpperCase()}</span></p>
              <p className="source-list-item-title">{unknown.text}</p>
              <p className="muted" data-testid="unknown-reason">Reason: {unknown.reason}</p>
              <p className="muted" data-testid="unknown-next-action">Next action: {unknown.suggestedNextAction}</p>
              {(unknown.relatedClaimIds ?? []).map((id) => <p key={`${unknown.id}-${id}`} data-testid="unknown-related-claim" className="muted">Claim: {id}</p>)}
              {(unknown.relatedSourceIds ?? []).map((id) => <p key={`${unknown.id}-${id}`} data-testid="unknown-related-source" className="muted">Source: {id}</p>)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" data-testid="unknown-empty-state">No structured unknowns were detected in this run. This does not mean every claim is fully verified.</p>
      )}
    </section>
  );
}
