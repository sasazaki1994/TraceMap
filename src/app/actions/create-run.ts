"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { createAnalysisRunFromProvider } from "@/server/analysis/create-analysis-run-from-provider";

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

  const runId = await createAnalysisRunFromProvider(raw.trim());
  redirect(`/runs/${runId}` as Route);
}
