import { expect, test } from "@playwright/test";

import { signInAsBetaUser } from "./support/auth";

test.describe("public-beta-readiness", () => {
  let databaseConnected = false;

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { database?: { status?: string } };
    databaseConnected = body.database?.status === "connected";
  });

  test("cross-product public beta flow", async ({ page }) => {
    test.skip(
      !databaseConnected,
      "Requires Postgres at DATABASE_URL, migrations applied, and dev server health check passing.",
    );

    const topic = `Public beta readiness ${Date.now()}`;

    await page.goto("/");
    await expect(page.getByText("Public Beta: TraceMap is under active development", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Research topic")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Investigation" })).toBeDisabled();
    await expect(page.getByText("Sign in to start a beta investigation.")).toBeVisible();

    await signInAsBetaUser(page, "public-beta-readiness");
    await page.goto("/");

    await page.getByLabel("Research topic").fill(topic);
    await page.getByTestId("manual-source-url-input").fill("https://example.com");
    await page.getByTestId("investigation-mode-selector").selectOption("standard");
    await page.getByRole("button", { name: "Start Investigation" }).click();

    await expect(page).toHaveURL(/\/runs\//);
    await expect(page.getByTestId("mission-header")).toBeVisible();
    await expect(page.getByTestId("mission-topic")).toContainText(topic);
    await expect(page.getByTestId("investigation-timeline")).toBeVisible();
    await expect(page.getByTestId("investigation-step")).toHaveCount(5);
    await expect(page.getByTestId("evidence-map")).toBeVisible();
    await expect(page.getByTestId("unknown-map-panel")).toBeVisible();
    await expect(page.getByTestId("unknown-map-item").first()).toBeVisible();
    await expect(page.getByTestId("source-lineage-panel")).toBeVisible();
    await expect(page.getByTestId("source-lineage-item").first()).toBeVisible();
    await expect(page.getByTestId("source-quality-panel")).toBeVisible();
    await expect(page.getByTestId("source-quality-item").first()).toBeVisible();
    await expect(page.getByTestId("briefing-report-panel")).toBeVisible();
    await expect(page.getByTestId("briefing-report-markdown")).toBeVisible();
    await expect(page.getByTestId("copy-markdown-button")).toBeVisible();
    await expect(page.getByTestId("download-markdown-button")).toBeVisible();

    await expect(page.getByTestId("share-link-section")).toBeVisible();
    await page.getByTestId("share-create-button").click();
    await expect(page.getByTestId("share-url")).toBeVisible({ timeout: 15_000 });

    const sharePath = await page.getByTestId("share-url").textContent();
    expect(sharePath).toContain("/share/");
    await page.goto(sharePath!);

    await expect(page.getByText("Shared view · read-only")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex.*nofollow|nofollow.*noindex/,
    );
    await expect(page.getByTestId("mission-header")).toBeVisible();

    await page.goto("/runs");
    await expect(page.getByTestId("run-history-page")).toBeVisible();
    await expect(page.getByTestId("run-history-status-filter")).toBeVisible();
    await expect(page.getByTestId("run-history-search")).toBeVisible();
    await expect(page.getByTestId("run-history-item").first()).toBeVisible();
  });
});
