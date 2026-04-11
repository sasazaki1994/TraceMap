"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { createMockAnalysisRun } from "@/server/analysis/create-mock-run";

export type CreateRunFormState = {
  error?: string;
};

export async function createMockRunAction(
  _prevState: CreateRunFormState,
  formData: FormData,
): Promise<CreateRunFormState> {
  const raw = formData.get("question");
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "Question is required." };
  }

  const runId = await createMockAnalysisRun(raw.trim());
  redirect(`/runs/${runId}` as Route);
}
