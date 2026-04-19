import { notFound } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { RunResultView } from "@/features/run/components/run-result-view";
import { mapAnswerEvidenceForView } from "@/server/analysis/map-run-evidence";
import { prisma } from "@/server/db/prisma";
import { parseAnswerGraphJson } from "@/types/answer-graph";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      analysisRun: {
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
      },
    },
  });

  if (!shareLink) {
    notFound();
  }

  if (shareLink.expiresAt !== null && shareLink.expiresAt < new Date()) {
    notFound();
  }

  const run = shareLink.analysisRun;
  const answer = run.answerSnapshots[0];
  if (!answer) {
    notFound();
  }

  const graph = parseAnswerGraphJson(answer.graphJson);
  const { evidenceClaims, evidenceAlerts } = mapAnswerEvidenceForView(answer);

  return (
    <main>
      <PageContainer className="home-grid">
        <p className="eyebrow" style={{ marginBottom: "-8px" }}>
          Shared view · read-only
        </p>
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
