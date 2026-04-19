import { expect, test } from "@playwright/test";

test.describe("source-detail-and-sharing", () => {
  let databaseConnected = false;

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      database?: { status?: string };
    };
    databaseConnected = body.database?.status === "connected";
  });

  test("run page creates share link and share URL shows read-only run", async ({
    page,
  }) => {
    test.skip(
      !databaseConnected,
      "Requires Postgres at DATABASE_URL, migrations applied, and dev server health check passing.",
    );

    await page.goto("/");

    await page.getByLabel("Question").fill("Share link E2E question?");
    await page.getByRole("button", { name: "Analyze Sources" }).click();

    await expect(page).toHaveURL(/\/runs\//);

    await page.getByRole("button", { name: "Create share link" }).click();

    const shareLocator = page.getByTestId("share-url");
    await expect(shareLocator).toBeVisible({ timeout: 15_000 });
    const href = await shareLocator.textContent();
    expect(href).toBeTruthy();
    expect(href).toContain("/share/");

    await page.goto(href!);

    await expect(page.getByText("Shared view · read-only")).toBeVisible();
    await expect(
      page.locator(".run-question").getByText("Share link E2E question?", { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("run-answer")).toBeVisible();
    await expect(page.getByTestId("run-graph")).toBeVisible();

    await page.getByTestId("source-row").first().click();
    await expect(page.getByTestId("source-detail-panel")).toBeVisible();
  });
});
