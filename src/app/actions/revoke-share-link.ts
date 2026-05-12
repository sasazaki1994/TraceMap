"use server";

import { revalidatePath } from "next/cache";

import { revokeShareLinkForRun } from "@/server/share/revoke-share-link";
import { getCurrentUser } from "@/server/auth/current-user";

export async function revokeShareLinkAction(params: {
  analysisRunId: string;
  shareLinkId: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.analysisRunId.trim()) {
    return { ok: false, error: "Missing run id." };
  }

  if (!params.shareLinkId.trim()) {
    return { ok: false, error: "Missing share link id." };
  }

  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Authentication required." };
    await revokeShareLinkForRun({
      analysisRunId: params.analysisRunId.trim(),
      shareLinkId: params.shareLinkId.trim(),
      ownerId: user.id,
    });
    revalidatePath(`/runs/${params.analysisRunId.trim()}`);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to revoke share link.";
    return { ok: false, error: message };
  }
}
