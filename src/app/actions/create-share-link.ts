"use server";

import { createShareLinkForRun } from "@/server/share/create-share-link-for-run";

export type CreateShareLinkState = {
  token?: string;
  error?: string;
};

export async function createShareLinkAction(
  _prevState: CreateShareLinkState,
  formData: FormData,
): Promise<CreateShareLinkState> {
  const raw = formData.get("analysisRunId");
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "Missing run id." };
  }

  try {
    const token = await createShareLinkForRun(raw.trim());
    return { token };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create share link.";
    return { error: message };
  }
}
