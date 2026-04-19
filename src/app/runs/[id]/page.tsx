import { notFound } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { RunResultView } from "@/features/run/components/run-result-view";
import { RunShareControls } from "@/features/run/components/run-share-controls";
import { mapAnswerEvidenceForView } from "@/server/analysis/map-run-evidence";
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
        include: {
          claims: {
            orderBy: { createdAt: "asc" },
            include: {
              counterpoints: { orderBy: { createdAt: "asc" } },
            },
          },
          alerts: { orderBy: { createdAt: "asc" } },
        },
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

  if (run.status === "failed") {
    return (
      <main>
        <PageContainer className="home-grid">
          <RunShareControls analysisRunId={run.id} />
          <RunResultView
            question={run.question}
            answerTitle={null}
            answerContent=""
            runStatusBanner={
              run.lastErrorMessage ??
              "This analysis run did not complete successfully."
            }
            evidenceAlerts={[]}
            evidenceClaims={[]}
            sources={[]}
            graph={{ version: 1, nodes: [], edges: [] }}
          />
        </PageContainer>
      </main>
    );
  }

  if (run.status !== "completed" || !answer) {
    const phase =
      run.status === "queued"
        ? "This run is queued."
        : "This run is still processing.";
    return (
      <main>
        <PageContainer className="home-grid">
          <RunShareControls analysisRunId={run.id} />
          <RunResultView
            question={run.question}
            answerTitle={null}
            answerContent=""
            runStatusBanner={`${phase} Refresh the page in a moment.`}
            evidenceAlerts={[]}
            evidenceClaims={[]}
            sources={[]}
            graph={{ version: 1, nodes: [], edges: [] }}
          />
        </PageContainer>
      </main>
    );
  }

  const graph = parseAnswerGraphJson(answer.graphJson);
  const { evidenceClaims, evidenceAlerts } = mapAnswerEvidenceForView(answer);

  return (
    <main>
      <PageContainer className="home-grid">
        <RunShareControls analysisRunId={run.id} />
        <RunResultView
          question={run.question}
          answerTitle={answer.title}
          answerContent={answer.content}
          evidenceAlerts={evidenceAlerts}
          evidenceClaims={evidenceClaims}
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
