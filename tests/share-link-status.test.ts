import { describe, expect, it } from "vitest";

import { isShareLinkActive } from "@/features/run/share-link-status";

describe("isShareLinkActive", () => {
  const now = new Date("2026-05-08T00:00:00.000Z");

  it("returns true when expiresAt is null", () => {
    expect(isShareLinkActive(null, now)).toBe(true);
  });

  it("returns true when expiresAt is in the future", () => {
    expect(isShareLinkActive("2026-05-08T00:00:01.000Z", now)).toBe(true);
  });

  it("returns false when expiresAt equals now", () => {
    expect(isShareLinkActive("2026-05-08T00:00:00.000Z", now)).toBe(false);
  });

  it("returns false when expiresAt is in the past", () => {
    expect(isShareLinkActive("2026-05-07T23:59:59.000Z", now)).toBe(false);
  });
});
