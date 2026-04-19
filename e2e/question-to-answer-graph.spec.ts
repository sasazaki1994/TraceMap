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
    await expect(page.getByText("Why is interpretability important?")).toBeVisible();
    await expect(page.getByTestId("run-answer")).toContainText("Mock trace snapshot");

    await expect(page.getByTestId("run-alerts")).toBeVisible();
    const alertRow = page.getByTestId("run-alert").first();
    await expect(alertRow).toBeVisible();
    await expect(alertRow).toHaveAttribute("data-alert-level", "warning");
    await expect(alertRow.getByTestId("run-alert-level")).toHaveText(/Warning/i);

    await expect(page.getByTestId("run-graph")).toBeVisible();
    await expect(page.getByTestId("run-claim-graph-link")).toContainText(
      "node_answer",
    );

    await page.getByTestId("graph-node-node_answer").click();
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

    await page.getByTestId("source-row").first().click();
    await expect(page.getByTestId("source-detail-panel")).toContainText(
      "Interpretability survey (mock)",
    );
  });
});