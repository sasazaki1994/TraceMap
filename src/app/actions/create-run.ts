"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";

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
  // DB列名互換のためフォーム名はquestionを維持。
  // UI上はResearch Topicとして扱い、既存API/永続化互換を壊さない。
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

  // runはowner scopeで分離する。未認証で作成させないことで
  // 履歴閲覧/共有リンク管理の境界を単純に保つ。
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sign in is required to start an investigation." };
  }

  const runId = await createAnalysisRunFromProvider(raw.trim(), {
    mode,
    manualSourceUrls: manualSourceUrlsResult.manualSourceUrls,
    ownerId: currentUser.id,
  });
  redirect(`/runs/${runId}` as Route);
}
