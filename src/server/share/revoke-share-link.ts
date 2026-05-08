import { prisma } from "@/server/db/prisma";

export async function revokeShareLinkForRun(params: {
  analysisRunId: string;
  shareLinkId: string;
}): Promise<void> {
  const shareLink = await prisma.shareLink.findFirst({
    where: {
      id: params.shareLinkId,
      analysisRunId: params.analysisRunId,
    },
    select: { id: true },
  });

  if (!shareLink) {
    throw new Error("Share link not found for this run.");
  }

  await prisma.shareLink.update({
    where: { id: params.shareLinkId },
    data: { expiresAt: new Date() },
  });
}
