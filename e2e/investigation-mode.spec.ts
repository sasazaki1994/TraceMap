import { expect, test } from "@playwright/test";

test("landing page shows investigation-oriented intake copy", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Turn a research topic into a traceable investigation mission.")).toBeVisible();
  await expect(page.getByText("Closed Alpha: TraceMap is under active development.")).toBeVisible();
  await expect(page.getByTestId("research-topic-examples")).toBeVisible();
  const modeSelector = page.getByTestId("investigation-mode-selector");
  await expect(modeSelector).toBeVisible();
  await expect(modeSelector).toHaveValue("standard");
  await expect(modeSelector.locator('[data-testid="investigation-mode-fast"]')).toHaveAttribute("value", "fast");
  await expect(modeSelector.locator('[data-testid="investigation-mode-standard"]')).toHaveAttribute("value", "standard");
  await expect(modeSelector.locator('[data-testid="investigation-mode-deep"]')).toHaveAttribute("value", "deep");
});

test("investigation panels are visible on a completed run", async ({ page, request }) => {
  const health = await request.get("/api/health");
  const payload = (await health.json()) as { database?: { status?: string } };
  test.skip(payload.database?.status !== "connected", "Requires connected DATABASE_URL.");

  await page.goto("/");
  await page.getByLabel("Research topic").fill("Investigation mode smoke test");
  await page.getByRole("button", { name: "Start Investigation" }).click();

  await expect(page).toHaveURL(/\/runs\//);
  await expect(page.getByTestId("mission-header")).toBeVisible();
  await expect(page.getByTestId("mission-topic")).toBeVisible();
  await expect(page.getByTestId("investigation-guide")).toBeVisible();
  await expect(page.getByTestId("investigation-guide-step")).toHaveCount(5);
  await expect(page.getByTestId("investigation-timeline")).toBeVisible();
  await expect(page.getByTestId("investigation-step")).toHaveCount(5);
  await expect(page.getByTestId("unknown-map-panel")).toBeVisible();
  await expect(page.getByTestId("unknown-map-item").first()).toBeVisible();
  await expect(page.getByTestId("source-lineage-panel")).toBeVisible();
  await expect(page.getByTestId("source-lineage-item").first()).toBeVisible();
  await expect(page.getByTestId("briefing-report-panel")).toBeVisible();
  await expect(page.getByTestId("briefing-report-markdown")).toBeVisible();
});
