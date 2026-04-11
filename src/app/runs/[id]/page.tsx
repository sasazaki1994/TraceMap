import { notFound } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { RunResultView } from "@/features/run/components/run-result-view";
import { prisma } from "@/server/db/prisma";
import { parseAnswerGraphJson } from "@/types/answer-graph";

type RunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunPage({ params }: RunPageProps) {
  const { id } = await params;

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

  if (!run) {
    notFound();
  }

  const answer = run.answerSnapshots[0];
  if (!answer) {
    notFound();
  }

  const graph = parseAnswerGraphJson(answer.graphJson);

  return (
    <main>
      <PageContainer className="home-grid">
        <RunResultView
          question={run.question}
          answerTitle={answer.title}
          answerContent={answer.content}
          sources={run.sourceSnapshots.map((s) => ({
            id: s.id,
            label: s.label,
            url: s.url,
            excerpt: s.excerpt,
            sourceType: s.sourceType,
          }))}
          graph={graph}
        />
      </PageContainer>
    </main>
  );
}
