export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { Panel } from "@/components/ui/panel";
import { RunHistoryView } from "@/features/run-history/components/run-history-view";
import {
  listRunHistory,
  normalizeRunHistorySearchQuery,
  parseRunHistoryStatusFilter,
} from "@/features/run-history/lib/list-runs";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function SavedInvestigationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) ?? {};
  const rawStatus = typeof resolved.status === "string" ? resolved.status : undefined;
  const rawQ = typeof resolved.q === "string" ? resolved.q : undefined;
  const status = parseRunHistoryStatusFilter(rawStatus);
  const q = normalizeRunHistorySearchQuery(rawQ);

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const items = await listRunHistory({ status, q, ownerId: user.id });

  return (
    <main data-testid="run-history-page">
      <PageContainer className="home-grid">
        <Panel>
          <div className="eyebrow">Run History</div>
          <RunHistoryView items={items} status={status} q={q} />
        </Panel>
      </PageContainer>
    </main>
  );
}
