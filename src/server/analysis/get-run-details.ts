import { prisma } from "@/server/db/prisma";

export type RunDetails = {
  run: {
    id: string;
    question: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  answerSnapshot: {
    id: string;
    title: string | null;
    model: string | null;
    content: string;
    graphJson: unknown;
    createdAt: Date;
  };
  sources: {
    id: string;
    label: string;
    sourceType: "web" | "document" | "note";
    url: string | null;
    excerpt: string | null;
    createdAt: Date;
  }[];
};

export async function getRunDetails(id: string): Promise<RunDetails | null> {
  const run = await prisma.analysisRun.findUnique({
    where: { id },
    include: {
      answerSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      sourceSnapshots: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const answer = run?.answerSnapshots[0];

  if (!run || !answer) {
    return null;
  }

  return {
    run: {
      id: run.id,
      question: run.question,
      status: run.status,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    },
    answerSnapshot: {
      id: answer.id,
      title: answer.title,
      model: answer.model,
      content: answer.content,
      graphJson: answer.graphJson,
      createdAt: answer.createdAt,
    },
    sources: run.sourceSnapshots.map((source) => ({
      id: source.id,
      label: source.label,
      sourceType: source.sourceType,
      url: source.url,
      excerpt: source.excerpt,
      createdAt: source.createdAt,
    })),
  };
}
