"use server";

import { createShareLinkForRun } from "@/server/share/create-share-link-for-run";
import { getCurrentUser } from "@/server/auth/current-user";

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
    const user = await getCurrentUser();
    if (!user) return { error: "Authentication required." };
    const token = await createShareLinkForRun(raw.trim(), user.id);
    return { token };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create share link.";
    return { error: message };
  }
}
