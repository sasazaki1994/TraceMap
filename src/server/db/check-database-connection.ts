import { prisma } from "@/server/db/prisma";
import type { DatabaseHealthStatus } from "@/types/health";

type DatabaseHealth = {
  configured: boolean;
  status: DatabaseHealthStatus;
};

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  if (!process.env.DATABASE_URL) {
    return {
      configured: false,
      status: "not_configured",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      configured: true,
      status: "connected",
    };
  } catch {
    return {
      configured: true,
      status: "unavailable",
    };
  }
}
