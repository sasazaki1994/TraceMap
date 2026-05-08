"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { resolveInvestigationMode } from "@/server/analysis/investigation-limits";
import { createAnalysisRunFromProvider } from "@/server/analysis/create-analysis-run-from-provider";
import { parseManualSourceUrls } from "@/app/actions/manual-source-urls";

export type CreateRunFormState = {
  error?: string;
};

export async function createMockRunAction(
  _prevState: CreateRunFormState,
  formData: FormData,
): Promise<CreateRunFormState> {
  const raw = formData.get("question");
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "Research topic is required." };
  }

  const rawMode = formData.get("mode");
  const mode = resolveInvestigationMode(
    typeof rawMode === "string" ? rawMode : undefined,
  );

  const manualSourceUrlsResult = parseManualSourceUrls(formData.get("sourceUrls"));
  if (manualSourceUrlsResult.kind === "error") {
    return { error: manualSourceUrlsResult.message };
  }

  const runId = await createAnalysisRunFromProvider(raw.trim(), {
    mode,
    manualSourceUrls: manualSourceUrlsResult.manualSourceUrls,
  });
  redirect(`/runs/${runId}` as Route);
}
