import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

import { PageContainer } from "@/components/ui/page-container";
import { RunResultView } from "@/features/run/components/run-result-view";
import { RunShareControls } from "@/features/run/components/run-share-controls";
import { type RunShareLinkView } from "@/features/run/share-link-status";
import { mapAnswerEvidenceForView } from "@/server/analysis/map-run-evidence";
import { selectLatestAnswerSnapshotForView } from "@/server/analysis/select-latest-answer-snapshot";
import { prisma } from "@/server/db/prisma";
import { getCurrentUser } from "@/server/auth/current-user";
import { parseAnswerGraphJson } from "@/types/answer-graph";

type RunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunPage({ params }: RunPageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) notFound();

  const run = await prisma.analysisRun.findUnique({
    where: { id },
    include: {
      shareLinks: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          token: true,
          createdAt: true,
          expiresAt: true,
        },
      },
      answerSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sourceSnapshots: {
            orderBy: { createdAt: "asc" },
          },
          claims: {
            orderBy: { createdAt: "asc" },
            include: {
              counterpoints: {
                orderBy: { createdAt: "asc" },
              },
              claimSourceSnapshots: {
                orderBy: { createdAt: "asc" },
                include: {
                  sourceSnapshot: {
                    select: {
                      id: true,
                      label: true,
                      sourceType: true,
                      url: true,
                      publishedAt: true,
                    },
                  },
                },
              },
              propagationChains: {
                orderBy: { createdAt: "asc" },
                include: {
                  steps: {
                    orderBy: { ordinal: "asc" },
                  },
                },
              },
              confidence: true,
            },
          },
          alerts: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!run || run.ownerId !== user.id) {
    notFound();
  }

  const answer = run.answerSnapshots[0] ?? null;
  const shareLinks: RunShareLinkView[] = run.shareLinks.map((link) => ({
    id: link.id,
    token: link.token,
    createdAt: link.createdAt.toISOString(),
    expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
  }));
  const { sources } = selectLatestAnswerSnapshotForView(run.answerSnapshots);

  if (run.status === "failed") {
    return (
      <main>
        <PageContainer className="home-grid">
          <Link href="/runs" className="saved-run-link">Back to saved investigations</Link>
          <RunShareControls analysisRunId={run.id} shareLinks={shareLinks} />
          <RunResultView
            question={run.question}
            answerTitle={null}
            answerContent=""
            runStatusVariant="error"
            runStatusBanner={
              `RUN FAILED: ${
                run.lastErrorMessage ??
                "調査結果を生成できませんでした。情報源が不足しているか、処理中にエラーが発生しました。別の調査テーマにするか、公式URLを追加して再実行してください。"
              }`
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
        ? "COLLECTING SOURCES: この調査はキューで待機中です。"
        : "EXTRACTING CLAIMS / LINKING EVIDENCE / DETECTING UNKNOWNS / BUILDING REPORT: 調査結果を生成中です。";
    return (
      <main>
        <PageContainer className="home-grid">
          <Link href="/runs" className="saved-run-link">Back to saved investigations</Link>
          <RunShareControls analysisRunId={run.id} shareLinks={shareLinks} />
          <RunResultView
            question={run.question}
            answerTitle={null}
            answerContent=""
            runStatusVariant="loading"
            runStatusBanner={`${phase} しばらくしてからページを更新してください。`}
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
        <Link href="/runs" className="saved-run-link">Back to saved investigations</Link>
        <RunShareControls analysisRunId={run.id} shareLinks={shareLinks} />
        <RunResultView
          question={run.question}
          answerTitle={answer.title}
          answerContent={answer.content}
          evidenceAlerts={evidenceAlerts}
          evidenceClaims={evidenceClaims}
          sources={sources}
          graph={graph}
        />
      </PageContainer>
    </main>
  );
}
