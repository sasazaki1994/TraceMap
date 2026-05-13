import { expect, type Page } from "@playwright/test";

export async function signInAsBetaUser(
  page: Page,
  suffix = `${Date.now()}`,
): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(`e2e+${suffix}@example.com`);
  await page.getByTestId("login-beta-code-input").fill(
    process.env.TRACEMAP_BETA_ACCESS_CODE ?? "tracemap-beta",
  );
  await page.getByTestId("login-submit-button").click();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("auth-status")).toContainText("Signed in as");
}
