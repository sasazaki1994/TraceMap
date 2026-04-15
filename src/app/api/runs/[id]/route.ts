import { NextResponse } from "next/server";

import { getRunDetails } from "@/server/analysis/get-run-details";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const runDetails = await getRunDetails(id);

    if (!runDetails) {
      return NextResponse.json({ error: "Run not found." }, { status: 404 });
    }

    return NextResponse.json(runDetails);
  } catch (error) {
    console.error("Failed to fetch run details", error);
    return NextResponse.json(
      { error: "Failed to fetch run details." },
      { status: 500 },
    );
  }
}
