import { expect, test } from "@playwright/test";

test.describe("run-history", () => {
  let databaseConnected = false;

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { database?: { status?: string } };
    databaseConnected = body.database?.status === "connected";
  });

  test("landing has saved investigations link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("saved-investigations-link")).toBeVisible();
    await expect(page.getByTestId("saved-investigations-link")).toHaveAttribute("href", "/runs");
  });

  test("runs page is reachable and shows empty/list state", async ({ page }) => {
    test.skip(
      !databaseConnected,
      "Requires Postgres at DATABASE_URL, migrations applied, and dev server health check passing.",
    );

    await page.goto("/runs");
    await expect(page.getByTestId("run-history-page")).toBeVisible();
    await expect(page.getByTestId("run-history-status-filter")).toBeVisible();
    await expect(page.getByTestId("run-history-search")).toBeVisible();
    const empty = page.getByTestId("run-history-empty");
    const item = page.getByTestId("run-history-item");
    await expect(empty.or(item.first())).toBeVisible();
  });

  test("created run appears in history and can be opened", async ({ page }) => {
    test.skip(
      !databaseConnected,
      "Requires Postgres at DATABASE_URL, migrations applied, and dev server health check passing.",
    );

    const topic = `Saved investigations ${Date.now()}`;
    await page.goto("/");
    await page.getByLabel("Research topic").fill(topic);
    await page.getByRole("button", { name: "Start Investigation" }).click();
    await expect(page).toHaveURL(/\/runs\//);

    await page.goto("/runs");
    const runItem = page.getByTestId("run-history-item").filter({ hasText: topic }).first();
    await expect(runItem).toBeVisible();
    await runItem.getByTestId("run-history-item-open").click();
    await expect(page).toHaveURL(/\/runs\//);
    await expect(page.getByTestId("mission-topic")).toContainText(topic);
  });
});
