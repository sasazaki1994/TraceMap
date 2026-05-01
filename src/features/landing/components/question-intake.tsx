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
      <h2>Start an investigation and trace the evidence behind the findings.</h2>
      <p className="muted">
        This slice stores a mock investigation run in Postgres and opens the run
        page with an evidence map, unknown map, source lineage, and report preview.
      </p>

      <form className="question-form" action={formAction}>
        <label className="question-label" htmlFor="question">
          Research topic
        </label>
        <textarea
          id="question"
          name="question"
          placeholder="例: 国内生成AI市場の主要プレイヤーを比較し、根拠と不明点を整理する"
          rows={6}
          disabled={isPending}
          required
        />
        {state.error ? <p className="form-error">{state.error}</p> : null}
        <div className="question-actions">
          <button type="submit" disabled={isPending}>
            {isPending ? "Running investigation..." : "Start Investigation"}
          </button>
          <span className="muted">Mock mission - instant completed run.</span>
        </div>
      </form>
    </Panel>
  );
}