"use server";

import { revalidatePath } from "next/cache";

import { revokeShareLinkForRun } from "@/server/share/revoke-share-link";

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
    await revokeShareLinkForRun({
      analysisRunId: params.analysisRunId.trim(),
      shareLinkId: params.shareLinkId.trim(),
    });
    revalidatePath(`/runs/${params.analysisRunId.trim()}`);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to revoke share link.";
    return { ok: false, error: message };
  }
}
