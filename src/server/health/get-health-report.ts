import { siteConfig } from "@/lib/site";
import { checkDatabaseConnection } from "@/server/db/check-database-connection";
import type { HealthResponse } from "@/types/health";

export async function getHealthReport(): Promise<HealthResponse> {
  const database = await checkDatabaseConnection();

  return {
    status: "ok",
    service: siteConfig.name,
    timestamp: new Date().toISOString(),
    database,
  };
}
