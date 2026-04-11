import { PageContainer } from "@/components/ui/page-container";
import { Panel } from "@/components/ui/panel";
import { QuestionIntake } from "@/features/landing/components/question-intake";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <main>
      <PageContainer className="home-grid">
        <Panel>
          <div className="eyebrow">Traceable AI Answers</div>
          <h1>{siteConfig.name}</h1>
          <p className="lead">{siteConfig.description}</p>
          <div className="status-strip">
            <span>App Router Ready</span>
            <span>Prisma Ready</span>
            <span>Spec Driven</span>
          </div>
        </Panel>

        <QuestionIntake />
      </PageContainer>
    </main>
  );
}
