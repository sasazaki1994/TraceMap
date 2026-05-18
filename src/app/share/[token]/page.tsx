export const dynamic = "force-dynamic";

import { PageContainer } from "@/components/ui/page-container";
import { RunResultView } from "@/features/run/components/run-result-view";
import { ShareInvalidState, SharePageChrome } from "@/features/share/components/share-page-chrome";
import { mapAnswerEvidenceForView } from "@/server/analysis/map-run-evidence";
import { selectLatestAnswerSnapshotForView } from "@/server/analysis/select-latest-answer-snapshot";
import { prisma } from "@/server/db/prisma";
import { parseAnswerGraphJson } from "@/types/answer-graph";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
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
              sourceSnapshots: {
                orderBy: { createdAt: "asc" },
              },
              claims: {
                orderBy: { createdAt: "asc" },
                include: {
                  counterpoints: { orderBy: { createdAt: "asc" } },
                  confidence: true,
                  propagationChains: {
                    orderBy: { createdAt: "asc" },
                    include: {
                      steps: {
                        orderBy: { ordinal: "asc" },
                      },
                    },
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
                          excerpt: true,
                          publishedAt: true,
                        },
                      },
                    },
                  },
                },
              },
              alerts: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
    },
  });

  const isInactive = !shareLink || (shareLink.expiresAt !== null && shareLink.expiresAt <= new Date());

  if (isInactive) {
    return (
      <main>
        <PageContainer className="home-grid">
          <ShareInvalidState />
        </PageContainer>
      </main>
    );
  }

  const run = shareLink.analysisRun;
  const { answer, sources } = selectLatestAnswerSnapshotForView(run.answerSnapshots);

  if (run.status === "failed") {
    return (
      <main>
        <PageContainer className="home-grid">
          <SharePageChrome expiresAt={shareLink.expiresAt}>
            <RunResultView
              question={run.question}
              answerTitle={null}
              answerContent=""
              runStatusBanner={
                run.lastErrorMessage ??
                "調査結果を生成できませんでした。情報源が不足しているか、処理中にエラーが発生しました。所有者に再度実行してもらってください。"
              }
              evidenceAlerts={[]}
              evidenceClaims={[]}
              sources={[]}
              graph={{ version: 1, nodes: [], edges: [] }}
            />
          </SharePageChrome>
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
          <SharePageChrome expiresAt={shareLink.expiresAt}>
            <RunResultView
              question={run.question}
              answerTitle={null}
              answerContent=""
              runStatusBanner={`${phase} しばらくしてからページを更新してください。`}
              evidenceAlerts={[]}
              evidenceClaims={[]}
              sources={[]}
              graph={{ version: 1, nodes: [], edges: [] }}
            />
          </SharePageChrome>
        </PageContainer>
      </main>
    );
  }

  const graph = parseAnswerGraphJson(answer.graphJson);
  const { evidenceClaims, evidenceAlerts } = mapAnswerEvidenceForView(answer);

  return (
    <main>
      <PageContainer className="home-grid">
        <SharePageChrome expiresAt={shareLink.expiresAt}>
          <RunResultView
            question={run.question}
            answerTitle={answer.title}
            answerContent={answer.content}
            evidenceAlerts={evidenceAlerts}
            evidenceClaims={evidenceClaims}
            sources={sources}
            graph={graph}
            runId={run.id}
            runStatus={run.status}
            runCreatedAt={run.createdAt.toISOString()}
            runUpdatedAt={run.updatedAt.toISOString()}
            answerModel={answer.model}
            answerGeneratedAt={answer.createdAt.toISOString()}
          />
        </SharePageChrome>
      </PageContainer>
    </main>
  );
}
