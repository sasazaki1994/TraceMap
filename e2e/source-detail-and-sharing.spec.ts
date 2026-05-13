import { expect, test } from "@playwright/test";
import { signInAsBetaUser } from "./support/auth";

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

    await signInAsBetaUser(page, "share-create");
    await page.goto("/");

    await page.getByLabel("Research topic").fill("Share link E2E question?");
    await page.getByRole("button", { name: "Start an Investigation" }).click();

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
    await expect(page.getByTestId("mission-header")).toBeVisible();
    await expect(page.getByTestId("investigation-timeline")).toBeVisible();
    await expect(page.getByTestId("run-answer")).toBeVisible();
    await expect(page.getByTestId("evidence-map")).toBeVisible();
    await expect(page.getByTestId("unknown-map-panel")).toBeVisible();
    await expect(page.getByTestId("source-lineage-panel")).toBeVisible();
    await expect(page.getByTestId("briefing-report-panel")).toBeVisible();
    await expect(page.getByTestId("briefing-report-markdown")).toContainText(
      "## Source Lineage Summary",
    );

    await page.getByTestId("source-row").first().click();
    await expect(page.getByTestId("source-detail-panel")).toBeVisible();
    await expect(page.getByTestId("source-verification-status").first()).toBeVisible();
  });

  test("revoked share link is no longer readable", async ({ page }) => {
    test.skip(
      !databaseConnected,
      "Requires Postgres at DATABASE_URL, migrations applied, and dev server health check passing.",
    );

    await signInAsBetaUser(page, "share-revoke");
    await page.goto("/");
    await page.getByLabel("Research topic").fill("Share link revoke E2E question?");
    await page.getByRole("button", { name: "Start an Investigation" }).click();
    await expect(page).toHaveURL(/\/runs\//);

    await page.getByTestId("share-create-button").click();
    const shareLocator = page.getByTestId("share-url");
    await expect(shareLocator).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.getByTestId("share-link-revoke-button").first()).toBeVisible({
      timeout: 15_000,
    });
    const href = await page.getByTestId("share-url").textContent();
    expect(href).toBeTruthy();

    await page.getByTestId("share-link-revoke-button").first().click();
    await expect(page.getByTestId("share-link-status").first()).toHaveText("EXPIRED", {
      timeout: 15_000,
    });
    await page.goto(href!);
    await expect(page.getByTestId("share-invalid-state")).toBeVisible();
    await expect(page.getByText("この共有リンクは無効または期限切れです。")).toBeVisible();
  });
});
