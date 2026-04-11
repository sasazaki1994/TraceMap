import { expect, test } from "@playwright/test";

test("home page and health endpoint are reachable", async ({ page, request }) => {
  const healthResponse = await request.get("/api/health");
  const healthPayload = await healthResponse.json();

  expect(healthResponse.ok()).toBeTruthy();
  expect(healthPayload).toMatchObject({
    status: "ok",
    service: "TraceMap",
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "TraceMap" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze Sources" })).toBeVisible();
});
