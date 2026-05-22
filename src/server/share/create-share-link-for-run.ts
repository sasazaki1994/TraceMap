import { randomBytes } from "node:crypto";

import { prisma } from "@/server/db/prisma";

function newShareToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * 指定runの読み取り専用share linkを作成し、外部公開用のopaque tokenを返す。
 */
export async function createShareLinkForRun(analysisRunId: string, ownerId: string): Promise<string> {
  const run = await prisma.analysisRun.findUnique({
    where: { id: analysisRunId, ownerId },
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
      // token衝突はほぼ起きない想定だが、限定公開URLの一意性を守るため再試行する。
    }
  }

  throw new Error("Could not allocate a unique share token.");
}
