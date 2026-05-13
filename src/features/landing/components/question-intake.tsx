"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  createMockRunAction,
  type CreateRunFormState,
} from "@/app/actions/create-run";
import { MANUAL_SOURCE_URLS_ERROR_MESSAGE } from "@/app/actions/manual-source-urls";
import { Panel } from "@/components/ui/panel";

const initialState: CreateRunFormState = {};

export function QuestionIntake({ disabled = false }: { disabled?: boolean }) {
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
        Public Beta: TraceMap is under active development. Please review outputs with
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
          disabled={isPending || disabled}
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
        <p
          className="muted"
          data-testid="manual-source-url-help"
          style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}
        >
          Add one URL per line. TraceMap will prioritize these sources when building the evidence map.
        </p>
        <textarea
          id="sourceUrls"
          name="sourceUrls"
          placeholder={`https://example.com/official-report
https://example.com/press-release
https://example.com/technical-doc`}
          rows={4}
          disabled={isPending || disabled}
          data-testid="manual-source-url-input"
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
          disabled={isPending || disabled}
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
        {state.error ? (
          <p
            className="form-error"
            data-testid={
              state.error === MANUAL_SOURCE_URLS_ERROR_MESSAGE
                ? "manual-source-url-error"
                : undefined
            }
          >
            {state.error}
          </p>
        ) : null}
        {disabled ? <p className="form-error">Sign in to start a beta investigation. <Link href="/login">Sign in</Link></p> : null}
        <div className="question-actions">
          <button type="submit" disabled={isPending || disabled}>
            {isPending ? "Running investigation..." : "Start an Investigation"}
          </button>
          <span className="muted">Public Beta baseline: mock mission creates an instant run after sign-in.</span>
        </div>
      </form>
    </Panel>
  );
}
