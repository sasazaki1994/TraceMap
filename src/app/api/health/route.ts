import { NextResponse } from "next/server";

import { getHealthReport } from "@/server/health/get-health-report";

export const runtime = "nodejs";

export async function GET() {
  const payload = await getHealthReport();

  return NextResponse.json(payload);
}
