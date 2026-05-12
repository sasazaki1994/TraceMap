import { prisma } from "@/server/db/prisma";

export async function revokeShareLinkForRun(params: {
  ownerId: string;
  analysisRunId: string;
  shareLinkId: string;
}): Promise<void> {
  const result = await prisma.shareLink.updateMany({
    where: {
      analysisRun: { is: { ownerId: params.ownerId } },
      id: params.shareLinkId,
      analysisRunId: params.analysisRunId,
    },
    data: { expiresAt: new Date() },
  });

  if (result.count === 0) {
    throw new Error("Share link not found for this run.");
  }
}
