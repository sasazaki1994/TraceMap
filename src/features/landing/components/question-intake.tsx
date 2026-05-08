"use client";

import { useActionState } from "react";

import {
  createMockRunAction,
  type CreateRunFormState,
} from "@/app/actions/create-run";
import { Panel } from "@/components/ui/panel";

const initialState: CreateRunFormState = {};

export function QuestionIntake() {
  const [state, formAction, isPending] = useActionState(
    createMockRunAction,
    initialState,
  );

  return (
    <Panel className="question-panel">
      <div className="eyebrow">Investigation Intake</div>
      <h2>Turn a research topic into a traceable investigation mission.</h2>
      <p className="muted">
        TraceMap is not a chat box. It decomposes your topic into claims, supporting
        evidence, unresolved unknowns, and source lineage so you can review where each
        finding comes from.
      </p>
      <p className="muted" style={{ marginTop: "0.5rem" }}>
        Closed Alpha: TraceMap is under active development. Please review outputs with
        the evidence map and source links before reuse.
      </p>

      <form className="question-form" action={formAction}>
        <label className="question-label" htmlFor="question">
          Research topic
        </label>
        <p className="muted" style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>
          Describe what you want to investigate and what angles should be checked
          (e.g., growth drivers, risks, competitors, unknowns).
        </p>
        <textarea
          id="question"
          name="question"
          placeholder="例: トヨタ自動車のEV戦略について、成長要因・リスク・競合状況・未確認事項を根拠付きで整理する"
          rows={6}
          disabled={isPending}
          required
        />
        <div className="muted" data-testid="research-topic-examples" style={{ marginTop: "0.6rem" }}>
          <p>Examples:</p>
          <p style={{ marginTop: "0.35rem" }}>公式URLを貼ると、根拠確認と出典追跡がしやすくなります。</p>
          <ul style={{ marginTop: "0.35rem", paddingLeft: "1rem" }}>
            <li>トヨタ自動車のEV戦略について、成長要因・リスク・競合状況・未確認事項を根拠付きで整理する</li>
            <li>国内生成AI市場の主要プレイヤーを比較し、公開情報ベースで市場機会と不明点を整理する</li>
            <li>RAGとAIエージェントの違いを、技術的主張・根拠・未確認点に分解する</li>
            <li>中小企業向けSaaS市場で、Vertical SaaSが伸びる要因とリスクを調査する</li>
          </ul>
        </div>
        <label className="question-label" htmlFor="sourceUrls" style={{ marginTop: "1rem" }}>
          Optional source URLs
        </label>
        <p className="muted" style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>
          Add one URL per line. TraceMap will prioritize these sources when building the evidence map.
        </p>
        <textarea
          id="sourceUrls"
          name="sourceUrls"
          placeholder={`https://example.com/official-report
https://example.com/press-release
https://example.com/technical-doc`}
          rows={4}
          disabled={isPending}
          data-testid="manual-source-urls-input"
        />
        <label className="question-label" htmlFor="mode" style={{ marginTop: "1rem" }}>
          Investigation depth
        </label>
        <p className="muted" style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>
          Choose how broad the investigation should be.
        </p>
        <select
          id="mode"
          name="mode"
          defaultValue="standard"
          disabled={isPending}
          data-testid="investigation-mode-selector"
        >
          <option value="fast" data-testid="investigation-mode-fast">
            Fast — quick scan with fewer sources and claims
          </option>
          <option value="standard" data-testid="investigation-mode-standard">
            Standard — balanced evidence map for normal research
          </option>
          <option value="deep" data-testid="investigation-mode-deep">
            Deep — broader investigation with more claims and counterpoints
          </option>
        </select>
        {state.error ? <p className="form-error">{state.error}</p> : null}
        <div className="question-actions">
          <button type="submit" disabled={isPending}>
            {isPending ? "Running investigation..." : "Start Investigation"}
          </button>
          <span className="muted">Closed Alpha demo path: mock mission creates an instant run.</span>
        </div>
      </form>
    </Panel>
  );
}
