"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/ui/panel";
import { alertLevelLabel } from "@/features/run/lib/alert-level-label";
import { describeGraphNodeTie } from "@/features/run/lib/graph-node-tie-label";
import { lensLabel, orderClaimsForLens } from "@/features/run/lib/run-lens";
import { cn } from "@/lib/cn";
import type { AnswerGraphJson } from "@/types/answer-graph";
import type {
  RunCounterpointRelationKind,
  RunClaimSupport,
  RunClaimSupportKind,
  RunEvidenceAlert,
  RunEvidenceClaim,
  RunEvidencePropagationStep,
  RunLens,
} from "@/types/run-evidence";

export type RunSourceView = {
  id: string;
  label: string;
  url: string | null;
  excerpt: string | null;
  sourceType: "web" | "document" | "note";
  publishedAt?: string | null;
};

type RunResultViewProps = {
  question: string;
  answerTitle: string | null;
  answerContent: string;
  sources: RunSourceView[];
  graph: AnswerGraphJson;
  evidenceClaims?: RunEvidenceClaim[];
  evidenceAlerts?: RunEvidenceAlert[];
  /** Shown when the run did not complete successfully (e.g. failed pipeline). */
  runStatusBanner?: string | null;
};

const GRAPH_W = 420;
/** Taller when claim nodes exist (v2) so source → claim → answer fits. */
const GRAPH_H = 260;
const NODE_R = 22;

function supportKindLabel(kind: RunClaimSupportKind): string {
  switch (kind) {
    case "direct":
      return "Direct support";
    case "supplemental":
      return "Supplemental support";
    case "indirect":
      return "Inferred support";
  }
}

function confidenceAxisLabel(value: boolean, positive = "Yes", negative = "No"): string {
  return value ? positive : negative;
}

function recencyStatusLabel(
  value: NonNullable<RunEvidenceClaim["confidence"]>["recencyStatus"],
): string {
  switch (value) {
    case "current":
      return "Current";
    case "stale":
      return "Stale";
    case "unknown":
      return "Unknown";
  }
}

function confidenceLevelLabel(
  value: NonNullable<RunEvidenceClaim["confidence"]>["level"],
): string {
  switch (value) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    case "insufficient":
      return "Insufficient";
  }
}

function counterpointKindLabel(kind: RunCounterpointRelationKind): string {
  switch (kind) {
    case "contradiction":
      return "Contradiction";
    case "alternative_interpretation":
      return "Alternative interpretation";
    case "different_premise":
      return "Different premise";
    case "different_definition":
      return "Different definition";
    case "temporal_mismatch":
      return "Temporal mismatch";
  }
}

function chainStepKindLabel(kind: RunEvidencePropagationStep["stepKind"]): string {
  switch (kind) {
    case "source":
      return "Source";
    case "evidence_snippet":
      return "Evidence snippet";
    case "source_interpretation":
      return "Interpretation";
    case "claim":
      return "Claim";
    case "answer_segment":
      return "Answer segment";
  }
}

function chainBoundaryLabel(boundary: RunEvidencePropagationStep["boundary"]): string {
  return boundary === "primary" ? "Primary information" : "Interpretation";
}

function layoutGraph(graph: AnswerGraphJson): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const cx = GRAPH_W / 2;
  const questionNode = graph.nodes.find((n) => n.kind === "question");
  const answerNode = graph.nodes.find((n) => n.kind === "answer");
  const sourceNodes = graph.nodes.filter((n) => n.kind === "source");
  const claimNodes =
    graph.version === 2
      ? [...graph.nodes.filter((n) => n.kind === "claim")].sort((a, b) =>
          a.id.localeCompare(b.id),
        )
      : [];

  if (questionNode) {
    map.set(questionNode.id, { x: cx, y: 36 });
  }
  if (answerNode) {
    map.set(answerNode.id, { x: cx, y: 104 });
  }

  const sourceY = claimNodes.length > 0 ? 218 : 200;
  const n = sourceNodes.length;
  sourceNodes.forEach((node, i) => {
    if (n === 1) {
      map.set(node.id, { x: cx, y: sourceY });
      return;
    }
    const x = 64 + (i * (GRAPH_W - 128)) / Math.max(n - 1, 1);
    map.set(node.id, { x, y: sourceY });
  });

  const m = claimNodes.length;
  claimNodes.forEach((node, i) => {
    if (m === 1) {
      map.set(node.id, { x: cx, y: 162 });
      return;
    }
    const x = 64 + (i * (GRAPH_W - 128)) / Math.max(m - 1, 1);
    map.set(node.id, { x, y: 162 });
  });

  return map;
}

function edgeEndpoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: from.x + ux * NODE_R,
    y1: from.y + uy * NODE_R,
    x2: to.x - ux * NODE_R,
    y2: to.y - uy * NODE_R,
  };
}

export function RunResultView({
  question,
  answerTitle,
  answerContent,
  sources,
  graph,
  evidenceClaims = [],
  evidenceAlerts = [],
  runStatusBanner,
}: RunResultViewProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(
    null,
  );
  const [selectedLens, setSelectedLens] = useState<RunLens>("rigor");
  const [knowledgeMode, setKnowledgeMode] = useState<"claims" | "counterpoints" | "chains">(
    "claims",
  );

  const positions = useMemo(() => layoutGraph(graph), [graph]);
  const lensClaims = useMemo(
    () => orderClaimsForLens(evidenceClaims, selectedLens),
    [evidenceClaims, selectedLens],
  );

  const selectedClaimSupportingSourceIds = useMemo(() => {
    if (!selectedGraphNodeId) {
      return new Set<string>();
    }
    const claim = lensClaims.find((c) => c.graphNodeId === selectedGraphNodeId);
    if (!claim) {
      return new Set<string>();
    }
    return new Set(claim.supportingSourceIds);
  }, [lensClaims, selectedGraphNodeId]);

  const selectedSourceSupportingClaims = useMemo(() => {
    if (!selectedSourceId) {
      return [] as Array<{
        claim: RunEvidenceClaim;
        support: RunClaimSupport;
      }>;
    }
    return lensClaims.flatMap((claim) =>
      claim.supports
        .filter((support) => support.sourceId === selectedSourceId)
        .map((support) => ({ claim, support })),
    );
  }, [lensClaims, selectedSourceId]);

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === selectedSourceId) ?? null,
    [sources, selectedSourceId],
  );

  const flatCounterpoints = useMemo(
    () =>
      lensClaims.flatMap((c) =>
        c.counterpoints.map((cp) => ({
          claimId: c.id,
          counterpointId: cp.id,
          relationKind: cp.relationKind,
          summary: cp.summary,
        })),
      ),
    [lensClaims],
  );

  const visibleChains = useMemo(
    () =>
      lensClaims
        .filter((claim) => claim.propagationSteps.length > 0)
        .map((claim) => ({ claim, steps: claim.propagationSteps })),
    [lensClaims],
  );

  return (
    <div className="run-grid">
      <div className="run-main">
        <Panel>
          <div className="run-question">
            <div className="run-question-label">Question</div>
            <p>{question}</p>
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
          {answerTitle ? <h2>{answerTitle}</h2> : <h2>Answer</h2>}
          <div className="run-answer-body" data-testid="run-answer">
            {answerContent}
          </div>

          {evidenceAlerts.length > 0 ? (
            <div
              data-testid="run-alerts-section"
              style={{ marginTop: "1.25rem" }}
            >
              <div data-testid="run-alerts">
                <h3 className="run-question-label">Alerts</h3>
                <ul className="evidence-alert-list">
                  {evidenceAlerts.map((a) => (
                    <li
                      key={a.id}
                      className={`evidence-alert evidence-alert--${a.level}`}
                      data-alert-level={a.level}
                      data-testid="run-alert"
                    >
                      <span
                        className="evidence-alert-level"
                        data-testid="run-alert-level"
                      >
                        {alertLevelLabel(a.level)}
                      </span>
                      <p
                        className="run-answer-body"
                        style={{ marginTop: 6 }}
                        data-testid="run-alert-message"
                      >
                        {a.message}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="knowledge-toolbar" data-testid="knowledge-toolbar">
            <div className="knowledge-lens-group" role="tablist" aria-label="Knowledge lens">
              {(["rigor", "timeliness", "practical"] as const).map((lens) => (
                <button
                  key={lens}
                  type="button"
                  className={`knowledge-toggle${selectedLens === lens ? " knowledge-toggle--active" : ""}`}
                  data-testid={`lens-${lens}`}
                  onClick={() => setSelectedLens(lens)}
                >
                  {lensLabel(lens)}
                </button>
              ))}
            </div>
            <div className="knowledge-mode-group" role="tablist" aria-label="Knowledge mode">
              {(
                [
                  ["claims", "Claims"],
                  ["counterpoints", "Counterpoints"],
                  ["chains", "Propagation chains"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  className={`knowledge-toggle${knowledgeMode === mode ? " knowledge-toggle--active" : ""}`}
                  data-testid={`knowledge-mode-${mode}`}
                  onClick={() => setKnowledgeMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <h3 className="run-question-label" style={{ marginTop: "1.25rem" }}>
            Evidence graph
          </h3>
          <div className="run-graph-wrap" data-testid="run-graph">
            {graph.nodes.length === 0 ? (
              <p className="muted">No graph data for this answer.</p>
            ) : (
              <svg
                className="run-graph-svg"
                width={GRAPH_W}
                height={GRAPH_H}
                viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
                role="img"
                aria-label="Evidence graph"
              >
                {graph.edges.map((edge) => {
                  const pFrom = positions.get(edge.from);
                  const pTo = positions.get(edge.to);
                  if (!pFrom || !pTo) {
                    return null;
                  }
                  const { x1, y1, x2, y2 } = edgeEndpoints(pFrom, pTo);
                  return (
                    <line
                      key={edge.id}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(148, 163, 184, 0.55)"
                      strokeWidth={2}
                    />
                  );
                })}
                {graph.nodes.map((node) => {
                  const p = positions.get(node.id);
                  if (!p) {
                    return null;
                  }
                  const isSource = node.kind === "source";
                  const linkedId = node.sourceSnapshotId;
                  const isClaim = node.kind === "claim";
                  const isAnswerOrQuestion =
                    node.kind === "answer" || node.kind === "question";
                  const graphInteract =
                    (isSource && linkedId !== undefined) ||
                    isAnswerOrQuestion ||
                    isClaim;

                  const sourceSelected =
                    isSource &&
                    linkedId !== undefined &&
                    linkedId === selectedSourceId;
                  const graphHighlight =
                    (isAnswerOrQuestion || isClaim) &&
                    selectedGraphNodeId === node.id;

                  const selected = sourceSelected || graphHighlight;

                  return (
                    <g
                      key={node.id}
                      className={`graph-node${graphInteract ? " graph-node--interactive" : ""}`}
                      data-testid={`graph-node-${node.id}`}
                      role={graphInteract ? "button" : undefined}
                      tabIndex={graphInteract ? 0 : undefined}
                      onClick={() => {
                        if (isSource && linkedId) {
                          setSelectedSourceId(linkedId);
                          setSelectedGraphNodeId(null);
                        } else if (isAnswerOrQuestion) {
                          setSelectedGraphNodeId(node.id);
                          setSelectedSourceId(null);
                        } else if (isClaim) {
                          setSelectedGraphNodeId(node.id);
                          setSelectedSourceId(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          graphInteract &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          if (isSource && linkedId) {
                            setSelectedSourceId(linkedId);
                            setSelectedGraphNodeId(null);
                          } else if (isAnswerOrQuestion) {
                            setSelectedGraphNodeId(node.id);
                            setSelectedSourceId(null);
                          } else if (isClaim) {
                            setSelectedGraphNodeId(node.id);
                            setSelectedSourceId(null);
                          }
                        }
                      }}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={NODE_R}
                        fill={
                          selected
                            ? "rgba(56, 189, 248, 0.35)"
                            : "rgba(30, 41, 59, 0.9)"
                        }
                        stroke={
                          selected ? "var(--accent-strong)" : "var(--border)"
                        }
                        strokeWidth={2}
                      />
                      <text
                        x={p.x}
                        y={p.y + 4}
                        textAnchor="middle"
                        fill="var(--foreground)"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {node.kind === "question"
                          ? "Q"
                          : node.kind === "answer"
                            ? "A"
                            : node.kind === "claim"
                              ? "C"
                              : "S"}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {lensClaims.length > 0 && knowledgeMode === "claims" ? (
            <div
              data-testid="run-claims-section"
              style={{ marginTop: "1.25rem" }}
            >
              <div data-testid="run-claims">
                <h3 className="run-question-label">Claims &amp; counterpoints</h3>
                <ul className="evidence-claim-list">
                  {lensClaims.map((c) => {
                    const tie = describeGraphNodeTie(graph, c.graphNodeId);
                    const linkedActive =
                      tie !== null &&
                      selectedGraphNodeId !== null &&
                      c.graphNodeId === selectedGraphNodeId;
                    const confidence = c.confidence;
                    return (
                      <li
                        key={c.id}
                        className={cn(
                          "evidence-claim-block",
                          linkedActive && "evidence-claim-block--linked-active",
                        )}
                        data-claim-matches-graph-node={
                          linkedActive ? "true" : undefined
                        }
                        data-graph-node-id={c.graphNodeId ?? undefined}
                        data-testid="run-claim"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (c.graphNodeId) {
                            setSelectedGraphNodeId(c.graphNodeId);
                            setSelectedSourceId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!c.graphNodeId) {
                            return;
                          }
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedGraphNodeId(c.graphNodeId);
                            setSelectedSourceId(null);
                          }
                        }}
                      >
                        {tie ? (
                          <p
                            className="muted evidence-claim-graph-link"
                            data-testid="run-claim-graph-link"
                          >
                            Graph: {tie.kindLabel} — {tie.nodeLabel}{" "}
                            <span className="evidence-claim-node-id">
                              ({tie.nodeId})
                            </span>
                          </p>
                        ) : null}
                        <p
                          className="source-list-item-title"
                          data-testid="run-claim-item"
                        >
                          {c.summary}
                        </p>
                        {confidence ? (
                          <>
                            <div
                              className="claim-confidence-row"
                              data-testid="run-claim-confidence"
                            >
                              <span
                                className={`claim-confidence-badge claim-confidence-badge--${confidence.level}`}
                              >
                                {confidenceLevelLabel(confidence.level)} {confidence.score}
                              </span>
                              <span className="muted">{confidence.summary}</span>
                            </div>
                            <dl
                              className="claim-confidence-breakdown"
                              data-testid="run-claim-confidence-breakdown"
                            >
                              <div>
                                <dt>Primary</dt>
                                <dd>
                                  {confidenceAxisLabel(confidence.hasPrimarySource)}
                                </dd>
                              </div>
                              <div>
                                <dt>Independent</dt>
                                <dd>{confidence.independentSourceCount}</dd>
                              </div>
                              <div>
                                <dt>Quote</dt>
                                <dd>
                                  {confidenceAxisLabel(confidence.hasSupportingQuote)}
                                </dd>
                              </div>
                              <div>
                                <dt>Recency</dt>
                                <dd>{recencyStatusLabel(confidence.recencyStatus)}</dd>
                              </div>
                              <div>
                                <dt>Contradiction</dt>
                                <dd>
                                  {confidenceAxisLabel(
                                    confidence.hasContradiction,
                                    "Present",
                                    "None",
                                  )}
                                </dd>
                              </div>
                            </dl>
                          </>
                        ) : null}
                        {c.supports.length > 0 ? (
                          <ul
                            className="claim-support-list"
                            data-testid="run-claim-support-list"
                          >
                            {c.supports.map((support) => (
                              <li
                                key={`${c.id}-${support.sourceId}`}
                                className="claim-support-item"
                                data-testid="run-claim-support-item"
                              >
                                <div className="claim-support-header">
                                  <span className="claim-support-kind">
                                    {supportKindLabel(support.supportKind)}
                                  </span>
                                  {support.isPrimarySource ? (
                                    <span className="claim-primary-badge">Primary source</span>
                                  ) : null}
                                </div>
                                <p className="source-list-item-title">
                                  {support.sourceLabel}
                                </p>
                                {support.supportingQuote ? (
                                  <p className="claim-support-quote">
                                    &quot;{support.supportingQuote}&quot;
                                  </p>
                                ) : null}
                                {support.contradictionNote ? (
                                  <p className="claim-support-contradiction">
                                    Contradiction: {support.contradictionNote}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {c.counterpoints.length > 0 ? (
                          <ul className="evidence-counterpoint-list">
                            {c.counterpoints.map((cp) => (
                              <li
                                key={cp.id}
                                className="evidence-counterpoint"
                                data-testid="run-counterpoint"
                              >
                                <span className="counterpoint-kind-badge">
                                  {counterpointKindLabel(cp.relationKind)}
                                </span>{" "}
                                {cp.summary}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {c.alerts.length > 0 ? (
                          <ul
                            className="evidence-alert-list"
                            style={{ marginTop: "0.65rem" }}
                            data-testid="run-claim-alerts"
                          >
                            {c.alerts.map((a) => (
                              <li
                                key={a.id}
                                className={`evidence-alert evidence-alert--${a.level}`}
                                data-alert-level={a.level}
                                data-testid="run-claim-alert"
                              >
                                <span
                                  className="evidence-alert-level"
                                  data-testid="run-claim-alert-level"
                                >
                                  {alertLevelLabel(a.level)}
                                </span>
                                <p
                                  className="run-answer-body"
                                  style={{ marginTop: 6 }}
                                  data-testid="run-claim-alert-message"
                                >
                                  {a.message}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : null}

          {flatCounterpoints.length > 0 && knowledgeMode === "counterpoints" ? (
            <div
              data-testid="run-counterpoints-section"
              style={{ marginTop: "1.25rem" }}
            >
              <h3 className="run-question-label">Counterpoints</h3>
              <ul className="evidence-list">
                {flatCounterpoints.map((cp) => (
                  <li
                    key={`${cp.claimId}-${cp.counterpointId}`}
                    data-testid="run-counterpoint-item"
                  >
                    <span className="counterpoint-kind-badge">
                      {counterpointKindLabel(cp.relationKind)}
                    </span>{" "}
                    {cp.summary}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {visibleChains.length > 0 && knowledgeMode === "chains" ? (
            <div
              data-testid="run-propagation-chains-section"
              style={{ marginTop: "1.25rem" }}
            >
              <h3 className="run-question-label">Propagation chains</h3>
              <ul className="chain-list">
                {visibleChains.map(
                  ({
                    claim,
                    steps,
                  }: {
                    claim: RunEvidenceClaim;
                    steps: RunEvidenceClaim["propagationSteps"];
                  }) => (
                  <li
                    key={`${claim.id}-chain`}
                    className="chain-list-item"
                    data-testid="run-propagation-chain"
                  >
                    <p className="source-list-item-title">{claim.summary}</p>
                    <div className="muted" style={{ marginTop: "6px" }}>
                      Source to answer interpretation chain
                    </div>
                    <ol className="chain-steps">
                      {steps.map((step: RunEvidenceClaim["propagationSteps"][number]) => (
                        <li
                          key={step.id}
                          className="chain-step"
                          data-testid="run-propagation-step"
                        >
                          <div className="chain-step-header">
                            <span className="claim-support-kind">
                              {chainStepKindLabel(step.stepKind)}
                            </span>
                            <span className="chain-boundary-badge">
                              {chainBoundaryLabel(
                                step.stepKind === "source" || step.stepKind === "evidence_snippet"
                                  ? "primary"
                                  : "interpretation",
                              )}
                            </span>
                          </div>
                          <p className="source-list-item-title">{step.label}</p>
                          {step.content ? <p className="muted">{step.content}</p> : null}
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <h3 className="run-question-label" style={{ marginTop: "1.25rem" }}>
            Sources
          </h3>
          <ul className="source-list">
            {sources.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  data-testid="source-row"
                  className={`source-list-item${selectedSourceId === s.id ? " selected" : ""}${selectedClaimSupportingSourceIds.has(s.id) ? " source-list-item--claim-linked" : ""}`}
                  onClick={() => {
                    setSelectedSourceId(s.id);
                    setSelectedGraphNodeId(null);
                  }}
                >
                  <div className="source-list-item-title">{s.label}</div>
                  <div className="source-list-item-meta">
                    {s.sourceType}
                    {s.url ? ` · ${s.url}` : ""}
                  </div>
                  {s.excerpt ? (
                    <div
                      className="muted"
                      data-testid="source-row-excerpt-preview"
                      style={{ marginTop: "0.35rem", fontSize: "0.85em", lineHeight: 1.35 }}
                    >
                      {s.excerpt.length > 140 ? `${s.excerpt.slice(0, 137)}…` : s.excerpt}
                    </div>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <aside>
        <Panel className="source-detail-panel">
          <div className="eyebrow">Source detail</div>
          <h3 style={{ marginTop: "8px" }}>Selection</h3>
          <div data-testid="source-detail-panel">
            {selectedSource ? (
              <>
                <p className="source-list-item-title">{selectedSource.label}</p>
                <p className="source-list-item-meta" style={{ marginTop: "8px" }}>
                  Type: {selectedSource.sourceType}
                </p>
                <p className="source-list-item-meta" style={{ marginTop: "4px" }}>
                  Published: {selectedSource.publishedAt ?? "Unknown"}
                </p>
                {selectedSource.url ? (
                  <p style={{ marginTop: "10px", wordBreak: "break-all" }}>
                    <a href={selectedSource.url} rel="noreferrer" target="_blank">
                      {selectedSource.url}
                    </a>
                  </p>
                ) : null}
                {selectedSource.excerpt ? (
                  <p className="run-answer-body" style={{ marginTop: "12px" }}>
                    {selectedSource.excerpt}
                  </p>
                ) : null}
                {selectedSourceSupportingClaims.length > 0 ? (
                  <div
                    style={{ marginTop: "16px" }}
                    data-testid="source-detail-supporting-claims"
                  >
                    <h4 className="run-question-label">Supporting claims</h4>
                    <ul className="claim-support-list">
                      {selectedSourceSupportingClaims.map(({ claim, support }) => (
                        <li
                          key={`${selectedSource.id}-${claim.id}`}
                          className="claim-support-item"
                        >
                          <div className="claim-support-header">
                            <span className="claim-support-kind">
                              {supportKindLabel(support.supportKind)}
                            </span>
                            {support.isPrimarySource ? (
                              <span className="claim-primary-badge">Primary source</span>
                            ) : null}
                          </div>
                          <p className="source-list-item-title">{claim.summary}</p>
                          {support.supportingQuote ? (
                            <p className="claim-support-quote">
                              &quot;{support.supportingQuote}&quot;
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {selectedSourceSupportingClaims.length > 0 ? (
                  <div
                    style={{ marginTop: "16px" }}
                    data-testid="source-detail-chain-explanations"
                  >
                    <h4 className="run-question-label">Chain explanations</h4>
                    <ul className="chain-list">
                      {selectedSourceSupportingClaims.flatMap(
                        ({ claim }: { claim: RunEvidenceClaim; support: RunClaimSupport }) => [
                          <li
                            key={`${selectedSource.id}-${claim.id}`}
                            className="chain-list-item"
                          >
                            <p className="source-list-item-title">
                              Source to answer interpretation chain
                            </p>
                            <ol className="chain-steps">
                              {claim.propagationSteps.map(
                                (step: RunEvidenceClaim["propagationSteps"][number]) => (
                                <li key={step.id} className="chain-step">
                                  <div className="chain-step-header">
                                    <span className="claim-support-kind">
                                      {chainStepKindLabel(step.stepKind)}
                                    </span>
                                    <span className="chain-boundary-badge">
                                      {chainBoundaryLabel(
                                        step.stepKind === "source" ||
                                          step.stepKind === "evidence_snippet"
                                          ? "primary"
                                          : "interpretation",
                                      )}
                                    </span>
                                  </div>
                                  <p className="muted" style={{ marginTop: "6px" }}>
                                    {step.label}
                                  </p>
                                </li>
                              ))}
                            </ol>
                          </li>
                        ],
                      )}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="detail-placeholder">
                Select a source from the list or graph.
              </p>
            )}
          </div>
        </Panel>
      </aside>
    </div>
  );
}
