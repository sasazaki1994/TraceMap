import { expect, test } from "@playwright/test";
import { signInAsBetaUser } from "./support/auth";

test("landing page shows investigation-oriented intake copy", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Analyze a research topic with traceable evidence and unknowns.")).toBeVisible();
  await expect(page.getByText("Public Beta: TraceMap is under active development.")).toBeVisible();
  await expect(page.getByTestId("research-topic-examples")).toBeVisible();
  const modeSelector = page.getByTestId("investigation-mode-selector");
  await expect(modeSelector).toBeVisible();
  await expect(modeSelector).toHaveValue("standard");
  await expect(modeSelector.locator('[data-testid="investigation-mode-fast"]')).toHaveAttribute("value", "fast");
  await expect(modeSelector.locator('[data-testid="investigation-mode-standard"]')).toHaveAttribute("value", "standard");
  await expect(modeSelector.locator('[data-testid="investigation-mode-deep"]')).toHaveAttribute("value", "deep");
  await expect(page.getByText("Sign in to start a beta investigation.")).toBeVisible();
  await expect(page.getByTestId("auth-status").getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("button", { name: "Start Investigation" })).toBeDisabled();
});

test("landing page shows manual source URL intake and validation message", async ({ page }) => {
  await signInAsBetaUser(page, "manual-url");
  await page.goto("/");
  await expect(page.getByText("Optional source URLs")).toBeVisible();
  await expect(page.getByTestId("manual-source-url-input")).toBeVisible();
  await page.getByTestId("manual-source-url-input").fill("not-a-url");
  await page.getByLabel("Research topic").fill("Manual source URL validation test");
  await page.getByRole("button", { name: "Start Investigation" }).click();
  await expect(page.getByTestId("manual-source-url-error")).toBeVisible();
  await expect(page.getByText(/Each source URL must use http or https/i)).toBeVisible();
});

test("investigation panels are visible on a completed run", async ({ page, request }) => {
  const health = await request.get("/api/health");
  const payload = (await health.json()) as { database?: { status?: string } };
  test.skip(payload.database?.status !== "connected", "Requires connected DATABASE_URL.");

  await signInAsBetaUser(page, "investigation-panels");
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
  await expect(page.getByTestId("run-metadata-panel")).toBeVisible();
  await expect(page.getByTestId("run-metadata-item").first()).toBeVisible();
  await expect(page.getByTestId("usage-meter-lite")).toBeVisible();
  await expect(page.getByTestId("usage-meter-item").first()).toBeVisible();
  await expect(page.getByTestId("unknown-map-panel")).toBeVisible();
  await expect(page.getByTestId("unknown-map-item").first()).toBeVisible();
  await expect(page.getByTestId("source-lineage-panel")).toBeVisible();
  await expect(page.getByTestId("source-lineage-item").first()).toBeVisible();
  await expect(page.getByTestId("source-quality-panel")).toBeVisible();
  await expect(page.getByTestId("source-quality-item").first()).toBeVisible();
  await expect(page.getByTestId("share-link-section")).toBeVisible();
  await expect(page.getByTestId("briefing-report-panel")).toBeVisible();
  await expect(page.getByTestId("briefing-report-markdown")).toBeVisible();
});
