"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/ui/panel";

type CreateQuestionResponse = {
  runId: string;
};

export function QuestionIntake() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Panel className="question-panel">
      <div className="eyebrow">MVP Prompt Intake</div>
      <h2>Ask a question and trace the evidence behind the answer.</h2>
      <p className="muted">
        This slice stores a mock analysis run in Postgres and opens the run page
        with a simple evidence graph (no LLM yet).
      </p>

      <form
        className="question-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const rawQuestion = formData.get("question");

          if (typeof rawQuestion !== "string" || !rawQuestion.trim()) {
            setError("Question is required.");
            return;
          }

          setIsPending(true);
          setError(null);

          try {
            const response = await fetch("/api/questions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ question: rawQuestion.trim() }),
            });

            if (!response.ok) {
              const body = (await response.json().catch(() => null)) as
                | { error?: string }
                | null;
              setError(body?.error ?? "Failed to create run.");
              return;
            }

            const payload = (await response.json()) as CreateQuestionResponse;
            router.push(`/runs/${payload.runId}`);
          } catch (submitError) {
            console.error("Failed to submit question", submitError);
            setError("Failed to create run.");
          } finally {
            setIsPending(false);
          }
        }}
      >
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
        {error ? <p className="form-error">{error}</p> : null}
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
