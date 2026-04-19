import { expect, test } from "@playwright/test";

test.describe("question-to-answer-graph", () => {
  let databaseConnected = false;

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      database?: { status?: string };
    };
    databaseConnected = body.database?.status === "connected";
  });

  test("home to submit to run page shows answer graph and source detail", async ({
    page,
  }) => {
    test.skip(
      !databaseConnected,
      "Requires Postgres at DATABASE_URL, migrations applied, and dev server health check passing.",
    );

    await page.goto("/");

    await page.getByLabel("Question").fill("Why is interpretability important?");
    await page.getByRole("button", { name: "Analyze Sources" }).click();

    await expect(page).toHaveURL(/\/runs\//);
    // Scope to the question panel: the same text is repeated inside the mock answer body.
    await expect(
      page.locator(".run-question").getByText("Why is interpretability important?", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByTestId("run-answer")).toContainText("Mock trace snapshot");

    await expect(page.getByTestId("run-alerts")).toBeVisible();
    const alertRow = page.getByTestId("run-alert").first();
    await expect(alertRow).toBeVisible();
    await expect(alertRow).toHaveAttribute("data-alert-level", "warning");
    await expect(alertRow.getByTestId("run-alert-level")).toHaveText(/Warning/i);

    await expect(page.getByTestId("run-graph")).toBeVisible();
    await expect(page.getByTestId("run-claim-graph-link").first()).toContainText(
      "node_claim_0",
    );

    await page.getByTestId("graph-node-node_claim_0").click();
    await expect(page.getByTestId("run-claim").first()).toHaveAttribute(
      "data-claim-matches-graph-node",
      "true",
    );

    await expect(page.getByTestId("run-claims")).toBeVisible();
    await expect(page.getByTestId("run-claim").first()).toBeVisible();
    await expect(page.getByTestId("run-counterpoint").first()).toBeVisible();
    await expect(page.getByTestId("graph-node-node_question")).toBeVisible();
    await expect(page.getByTestId("graph-node-node_answer")).toBeVisible();
    await expect(page.getByTestId("graph-node-node_source_a")).toBeVisible();

    await expect(page.getByTestId("run-claims-section")).toContainText("mock claim");
    await expect(page.getByTestId("run-counterpoints-section")).toContainText(
      "Mock counterpoint",
    );
    await expect(page.getByTestId("run-alerts-section")).toContainText("Mock alert");
    await expect(page.getByTestId("run-alert-level").first()).toHaveText(/Warning/i);

    await page.getByTestId("source-row").first().click();
    await expect(page.getByTestId("source-detail-panel")).toContainText(
      "Interpretability survey (mock)",
    );
  });
});