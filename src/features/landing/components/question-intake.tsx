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
      <div className="eyebrow">MVP Prompt Intake</div>
      <h2>Ask a question and trace the evidence behind the answer.</h2>
      <p className="muted">
        This slice stores a mock analysis run in Postgres and opens the run page
        with a simple evidence graph (no LLM yet).
      </p>

      <form className="question-form" action={formAction}>
        <label className="question-label" htmlFor="question">
          Question
        </label>
        <textarea
          id="question"
          name="question"
          placeholder="What sources explain the trade-offs between interpretability and retrieval quality in answer graphs?"
          rows={6}
          disabled={isPending}
          required
        />
        {state.error ? <p className="form-error">{state.error}</p> : null}
        <div className="question-actions">
          <button type="submit" disabled={isPending}>
            {isPending ? "Running..." : "Analyze Sources"}
          </button>
          <span className="muted">Mock pipeline - instant completed run.</span>
        </div>
      </form>
    </Panel>
  );
}