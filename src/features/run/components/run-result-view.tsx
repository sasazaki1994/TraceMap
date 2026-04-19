"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/ui/panel";
import type { AnswerGraphJson } from "@/types/answer-graph";

export type RunSourceView = {
  id: string;
  label: string;
  url: string | null;
  excerpt: string | null;
  sourceType: "web" | "document" | "note";
};

export type RunClaimView = {
  id: string;
  body: string;
};

export type RunCounterpointView = {
  id: string;
  body: string;
};

/** Mirrors `AlertLevel` in Prisma; kept client-safe without importing @prisma/client. */
export type RunAlertLevel = "info" | "low" | "medium" | "high";

export type RunAlertView = {
  id: string;
  level: RunAlertLevel;
  message: string;
};

type RunResultViewProps = {
  question: string;
  answerTitle: string | null;
  answerContent: string;
  claims: RunClaimView[];
  counterpoints: RunCounterpointView[];
  alerts: RunAlertView[];
  sources: RunSourceView[];
  graph: AnswerGraphJson;
};

const GRAPH_W = 420;
const GRAPH_H = 240;
const NODE_R = 22;

function layoutGraph(graph: AnswerGraphJson): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const cx = GRAPH_W / 2;
  const questionNode = graph.nodes.find((n) => n.kind === "question");
  const answerNode = graph.nodes.find((n) => n.kind === "answer");
  const sourceNodes = graph.nodes.filter((n) => n.kind === "source");

  if (questionNode) {
    map.set(questionNode.id, { x: cx, y: 40 });
  }
  if (answerNode) {
    map.set(answerNode.id, { x: cx, y: 120 });
  }

  const n = sourceNodes.length;
  sourceNodes.forEach((node, i) => {
    if (n === 1) {
      map.set(node.id, { x: cx, y: 200 });
      return;
    }
    const x = 64 + (i * (GRAPH_W - 128)) / Math.max(n - 1, 1);
    map.set(node.id, { x, y: 200 });
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
  claims,
  counterpoints,
  alerts,
  sources,
  graph,
}: RunResultViewProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const positions = useMemo(() => layoutGraph(graph), [graph]);

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === selectedSourceId) ?? null,
    [sources, selectedSourceId],
  );

  return (
    <div className="run-grid">
      <div className="run-main">
        <Panel>
          <div className="run-question">
            <div className="run-question-label">Question</div>
            <p>{question}</p>
          </div>
          {answerTitle ? <h2>{answerTitle}</h2> : <h2>Answer</h2>}
          <div className="run-answer-body" data-testid="run-answer">
            {answerContent}
          </div>

          <div
            className="run-evidence-block"
            data-testid="run-claims-section"
            style={{ marginTop: "1.25rem" }}
          >
            <h3 className="run-question-label">Claims</h3>
            {claims.length === 0 ? (
              <p className="muted">No claims for this run.</p>
            ) : (
              <ul className="evidence-list">
                {claims.map((c) => (
                  <li key={c.id} data-testid="run-claim-item">
                    {c.body}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="run-evidence-block"
            data-testid="run-counterpoints-section"
            style={{ marginTop: "1.25rem" }}
          >
            <h3 className="run-question-label">Counterpoints</h3>
            {counterpoints.length === 0 ? (
              <p className="muted">No counterpoints for this run.</p>
            ) : (
              <ul className="evidence-list">
                {counterpoints.map((c) => (
                  <li key={c.id} data-testid="run-counterpoint-item">
                    {c.body}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="run-evidence-block"
            data-testid="run-alerts-section"
            style={{ marginTop: "1.25rem" }}
          >
            <h3 className="run-question-label">Alerts</h3>
            {alerts.length === 0 ? (
              <p className="muted">No alerts for this run.</p>
            ) : (
              <ul className="evidence-list evidence-alert-list">
                {alerts.map((a) => (
                  <li key={a.id} data-testid="run-alert-item">
                    <span
                      className="run-alert-level"
                      data-testid="run-alert-level"
                    >
                      {a.level}
                    </span>
                    <span data-testid="run-alert-message">{a.message}</span>
                  </li>
                ))}
              </ul>
            )}
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
                  const selected =
                    isSource &&
                    linkedId !== undefined &&
                    linkedId === selectedSourceId;
                  return (
                    <g
                      key={node.id}
                      className="graph-node"
                      data-testid={`graph-node-${node.id}`}
                      role={isSource && linkedId ? "button" : undefined}
                      tabIndex={isSource && linkedId ? 0 : undefined}
                      onClick={() => {
                        if (isSource && linkedId) {
                          setSelectedSourceId(linkedId);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          isSource &&
                          linkedId &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          setSelectedSourceId(linkedId);
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
                            : "S"}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <h3 className="run-question-label" style={{ marginTop: "1.25rem" }}>
            Sources
          </h3>
          <ul className="source-list">
            {sources.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  data-testid="source-row"
                  className={`source-list-item${selectedSourceId === s.id ? " selected" : ""}`}
                  onClick={() => {
                    setSelectedSourceId(s.id);
                  }}
                >
                  <div className="source-list-item-title">{s.label}</div>
                  <div className="source-list-item-meta">
                    {s.sourceType}
                    {s.url ? ` · ${s.url}` : ""}
                  </div>
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
