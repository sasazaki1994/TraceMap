import { PageContainer } from "@/components/ui/page-container";
import { Panel } from "@/components/ui/panel";
import { QuestionIntake } from "@/features/landing/components/question-intake";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { AuthStatus } from "@/components/auth/auth-status";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <main>
      <PageContainer className="home-grid">
        <Panel>
          <div className="eyebrow">Investigation Console</div>
          <h1>{siteConfig.name}</h1>
          <p className="lead">{siteConfig.description}</p>
          <div className="status-strip">
            <span>App Router Ready</span>
            <span>Prisma Ready</span>
            <span>Spec Driven</span>
          </div>
          <AuthStatus />
          <div style={{ marginTop: "1rem" }}>
            <Link href="/runs" data-testid="saved-investigations-link" className="saved-run-link">
              Saved Investigations
            </Link>
          </div>
        </Panel>

        <QuestionIntake disabled={!user} />
      </PageContainer>
    </main>
  );
}
