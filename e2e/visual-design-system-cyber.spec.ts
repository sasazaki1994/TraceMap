import { expect, test } from "@playwright/test";

test.describe("visual-design-system-cyber", () => {
  test("home exposes TraceMap title and root defines design tokens", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "TraceMap" })).toBeVisible();

    const tokens = await page.evaluate(() => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      return {
        background: style.getPropertyValue("--background").trim(),
        foreground: style.getPropertyValue("--foreground").trim(),
        accent: style.getPropertyValue("--accent").trim(),
        border: style.getPropertyValue("--border").trim(),
      };
    });

    expect(tokens.background).toMatch(/^#/);
    expect(tokens.foreground).toMatch(/^#/);
    expect(tokens.accent).toMatch(/^#/);
    // Browsers may resolve `rgba(...)` to an 8-digit hex with alpha.
    expect(tokens.border.length).toBeGreaterThan(0);

    const panelBg = await page.evaluate(() => {
      const el = document.querySelector(".panel");
      if (!el) {
        return null;
      }
      return getComputedStyle(el).backgroundColor;
    });
    expect(panelBg).toBeTruthy();
  });
});
