import { randomBytes } from "node:crypto";

import { prisma } from "@/server/db/prisma";

function newShareToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Creates a read-only share link row for an analysis run. Returns the opaque token.
 */
export async function createShareLinkForRun(analysisRunId: string): Promise<string> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: analysisRunId },
    select: { id: true },
  });

  if (!run) {
    throw new Error("Analysis run not found.");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = newShareToken();
    try {
      await prisma.shareLink.create({
        data: {
          analysisRunId,
          token,
        },
      });
      return token;
    } catch {
      // Extremely unlikely: token collision — retry
    }
  }

  throw new Error("Could not allocate a unique share token.");
}
