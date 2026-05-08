import Link from "next/link";

import { PageContainer } from "@/components/ui/page-container";
import { Panel } from "@/components/ui/panel";
import { prisma } from "@/server/db/prisma";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function statusClassName(status: "queued" | "processing" | "completed" | "failed"): string {
  switch (status) {
    case "completed":
      return "saved-run-status saved-run-status--completed";
    case "failed":
      return "saved-run-status saved-run-status--failed";
    case "processing":
      return "saved-run-status saved-run-status--processing";
    case "queued":
      return "saved-run-status saved-run-status--queued";
  }
}

function formatDate(value: Date): string {
  return DATE_FORMATTER.format(value);
}

function shortenError(message: string, max = 140): string {
  return message.length <= max ? message : `${message.slice(0, max).trim()}…`;
}

export default async function SavedInvestigationsPage() {
  const runs = await prisma.analysisRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      question: true,
      status: true,
      lastErrorMessage: true,
      createdAt: true,
      updatedAt: true,
      answerSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          title: true,
          _count: {
            select: {
              sourceSnapshots: true,
              claims: true,
              alerts: true,
            },
          },
        },
      },
    },
  });

  return (
    <main data-testid="saved-investigations-page">
      <PageContainer className="home-grid">
        <Panel>
          <div className="eyebrow">Run History</div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>Saved Investigations</h1>
          <p className="lead">
            Review previous investigation missions, reopen evidence maps, and reuse
            briefing reports.
          </p>

          {runs.length === 0 ? (
            <div data-testid="saved-investigations-empty" className="saved-run-empty">
              <p>No saved investigations yet.</p>
              <p className="muted" style={{ marginBottom: "0.9rem" }}>
                Start a new investigation from a research topic to build an evidence map.
              </p>
              <Link href="/" className="saved-run-link">
                Start Investigation
              </Link>
            </div>
          ) : (
            <ul className="saved-run-list">
              {runs.map((run) => {
                const latestAnswer = run.answerSnapshots[0] ?? null;
                return (
                  <li key={run.id} data-testid="saved-investigation-item" className="saved-run-item">
                    <div className="saved-run-item-top">
                      <h2 data-testid="saved-investigation-topic" className="saved-run-topic">
                        {run.question}
                      </h2>
                      <span
                        data-testid="saved-investigation-status"
                        className={statusClassName(run.status)}
                      >
                        {run.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="muted saved-run-time">
                      Created: {formatDate(run.createdAt)} · Updated: {formatDate(run.updatedAt)}
                    </p>
                    <p data-testid="saved-investigation-answer-title" className="saved-run-answer-title">
                      Latest answer: {latestAnswer?.title?.trim() || "(No answer title)"}
                    </p>
                    <div className="saved-run-meta">
                      <span data-testid="saved-investigation-source-count">
                        Sources: {latestAnswer?._count.sourceSnapshots ?? 0}
                      </span>
                      <span data-testid="saved-investigation-claim-count">
                        Claims: {latestAnswer?._count.claims ?? 0}
                      </span>
                      <span data-testid="saved-investigation-alert-count">
                        Alerts: {latestAnswer?._count.alerts ?? 0}
                      </span>
                    </div>
                    {run.status === "failed" && run.lastErrorMessage ? (
                      <p data-testid="saved-investigation-error" className="saved-run-error">
                        {shortenError(run.lastErrorMessage)}
                      </p>
                    ) : null}
                    <Link
                      href={`/runs/${run.id}`}
                      data-testid="saved-investigation-open-link"
                      className="saved-run-link"
                    >
                      Open run
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </PageContainer>
    </main>
  );
}
