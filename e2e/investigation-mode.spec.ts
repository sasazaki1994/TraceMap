import { expect, test } from "@playwright/test";

test("investigation panels are visible on a completed run", async ({ page, request }) => {
  const health = await request.get("/api/health");
  const payload = (await health.json()) as { database?: { status?: string } };
  test.skip(payload.database?.status !== "connected", "Requires connected DATABASE_URL.");

  await page.goto("/");
  await page.getByLabel("Research topic").fill("Investigation mode smoke test");
  await page.getByRole("button", { name: "Start Investigation" }).click();

  await expect(page).toHaveURL(/\/runs\//);
  await expect(page.getByTestId("mission-header")).toBeVisible();
  await expect(page.getByTestId("investigation-timeline")).toBeVisible();
  await expect(page.getByTestId("unknown-map-panel")).toBeVisible();
  await expect(page.getByTestId("source-lineage-panel")).toBeVisible();
  await expect(page.getByTestId("briefing-report-panel")).toBeVisible();
});
