import { notFound } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { RunResultView } from "@/features/run/components/run-result-view";
import { getRunDetails } from "@/server/analysis/get-run-details";
import { parseAnswerGraphJson } from "@/types/answer-graph";

type RunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunPage({ params }: RunPageProps) {
  const { id } = await params;

  const runDetails = await getRunDetails(id);

  if (!runDetails) {
    notFound();
  }

  const graph = parseAnswerGraphJson(runDetails.answerSnapshot.graphJson);

  return (
    <main>
      <PageContainer className="home-grid">
        <RunResultView
          question={runDetails.run.question}
          answerTitle={runDetails.answerSnapshot.title}
          answerContent={runDetails.answerSnapshot.content}
          sources={runDetails.sources.map((s) => ({
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
