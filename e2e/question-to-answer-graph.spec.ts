import { expect, test } from "@playwright/test";

test.describe("investigation-mode", () => {
  let databaseConnected = false;

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      database?: { status?: string };
    };
    databaseConnected = body.database?.status === "connected";
  });

  test("home to submit to run page shows lenses, counterpoints, and chain detail", async ({
    page,
  }) => {
    test.skip(
      !databaseConnected,
      "Requires Postgres at DATABASE_URL, migrations applied, and dev server health check passing.",
    );

    await page.goto("/");

    await page.getByLabel("Research topic").fill("Why is interpretability important?");
    await page.getByRole("button", { name: "Start Investigation" }).click();

    await expect(page).toHaveURL(/\/runs\//);
    // Scope to the question panel: the same text is repeated inside the mock answer body.
    await expect(
      page.locator(".run-question").getByText("Why is interpretability important?", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByTestId("mission-header")).toBeVisible();
    await expect(page.getByTestId("mission-topic")).toContainText(
      "Why is interpretability important?",
    );
    await expect(page.getByTestId("investigation-timeline")).toBeVisible();
    await expect(page.getByTestId("investigation-step")).toHaveCount(5);
    await expect(page.getByTestId("run-answer")).toContainText("Mock trace snapshot");
    await expect(page.getByTestId("unknown-map-panel")).toBeVisible();
    await expect(page.getByTestId("unknown-map-item").first()).toBeVisible();

    await expect(page.getByTestId("run-alerts")).toBeVisible();
    const alertRow = page.getByTestId("run-alert").first();
    await expect(alertRow).toBeVisible();
    await expect(alertRow).toHaveAttribute("data-alert-level", "warning");
    await expect(alertRow.getByTestId("run-alert-level")).toHaveText(/Warning/i);

    await expect(page.getByTestId("evidence-map")).toBeVisible();
    await expect(page.getByTestId("run-claim-graph-link").first()).toContainText(
      "node_claim_0",
    );

    await page.getByTestId("graph-node-node_claim_0").click();
    await expect(page.getByTestId("run-claim").first()).toHaveAttribute(
      "data-claim-matches-graph-node",
      "true",
    );
    await expect(page.locator(".source-list-item--claim-linked")).toHaveCount(2);
    await expect(page.getByTestId("run-claim-confidence").first()).toContainText("Confidence");
    await expect(page.getByTestId("run-claim-support-item").first()).toContainText(
      /direct support/i,
    );
    await expect(page.getByTestId("knowledge-toolbar")).toBeVisible();
    await page.getByRole("button", { name: /timeliness first/i }).click();
    await expect(page.getByTestId("knowledge-toolbar")).toContainText("Timeliness first");

    await expect(page.getByTestId("run-claims")).toBeVisible();
    await expect(page.getByTestId("run-claim").first()).toBeVisible();
    await expect(page.getByTestId("run-counterpoint").first()).toBeVisible();
    await expect(page.getByTestId("graph-node-node_question")).toBeVisible();
    await expect(page.getByTestId("graph-node-node_answer")).toBeVisible();
    await expect(page.getByTestId("graph-node-node_source_a")).toBeVisible();

    await expect(page.getByTestId("run-claims-section")).toContainText("mock claim");
    await expect(page.getByTestId("run-counterpoint").first()).toContainText(
      "Mock counterpoint",
    );
    await expect(page.getByTestId("run-claim-alert").first()).toHaveAttribute(
      "data-alert-level",
      "info",
    );
    await expect(
      page.getByTestId("run-claim-alert").filter({ hasText: "no primary source" }),
    ).toHaveCount(1);
    await expect(page.getByTestId("run-alerts-section")).toContainText("Mock alert");
    await expect(page.getByTestId("run-alert-level").first()).toHaveText(/Warning/i);
    await expect(page.getByTestId("source-lineage-panel")).toBeVisible();
    await expect(page.getByTestId("source-lineage-item").first()).toContainText(
      "Interpretability survey (mock)",
    );
    await expect(page.getByTestId("briefing-report-panel")).toBeVisible();
    await expect(page.getByTestId("briefing-report-markdown")).toContainText(
      "# Briefing Report",
    );

    await page.getByTestId("source-row").first().click();
    await expect(page.getByTestId("source-detail-panel")).toContainText(
      "Interpretability survey (mock)",
    );
    await expect(page.getByTestId("source-detail-supporting-claims")).toContainText(
      /direct support/i,
    );
    await expect(page.getByTestId("source-detail-supporting-claims")).toContainText(
      "The synthesis aggregates mocked sources into a single narrative",
    );
    await page.getByTestId("knowledge-mode-counterpoints").click();
    await expect(page.getByTestId("run-counterpoints-section")).toContainText("Contradiction");
    await page.getByTestId("knowledge-mode-chains").click();
    await expect(page.getByTestId("run-propagation-chains-section")).toBeVisible();
    await expect(page.getByTestId("run-propagation-step").first()).toContainText(/Source/i);
  });

  test("repeated topic creates a new run page with investigation panels", async ({
    page,
  }) => {
    test.skip(
      !databaseConnected,
      "Requires Postgres at DATABASE_URL, migrations applied, and dev server health check passing.",
    );

    const topic = `Run cache smoke ${Date.now()}`;

    await page.goto("/");
    await page.getByLabel("Research topic").fill(topic);
    await page.getByRole("button", { name: "Start Investigation" }).click();
    await expect(page).toHaveURL(/\/runs\//);
    const firstRunUrl = page.url();

    await page.goto("/");
    await page.getByLabel("Research topic").fill(topic);
    await page.getByRole("button", { name: "Start Investigation" }).click();
    await expect(page).toHaveURL(/\/runs\//);
    expect(page.url()).not.toBe(firstRunUrl);

    await expect(page.getByTestId("run-answer")).toContainText("Mock trace snapshot");
    await expect(page.getByTestId("evidence-map")).toBeVisible();
    await expect(page.getByTestId("unknown-map-panel")).toBeVisible();
    await expect(page.getByTestId("source-lineage-panel")).toBeVisible();
    await expect(page.getByTestId("briefing-report-panel")).toBeVisible();
  });
});