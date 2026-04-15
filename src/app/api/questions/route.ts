import { NextResponse } from "next/server";
import { z } from "zod";

import { createMockAnalysisRun } from "@/server/analysis/create-mock-run";

const createQuestionSchema = z.object({
  question: z.string().trim().min(1, "Question is required."),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = createQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const runId = await createMockAnalysisRun(parsed.data.question);
    return NextResponse.json({ runId });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    console.error("Failed to create analysis run", error);
    return NextResponse.json(
      { error: "Failed to create analysis run." },
      { status: 500 },
    );
  }
}
