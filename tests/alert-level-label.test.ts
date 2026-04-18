import { describe, expect, it } from "vitest";

import { alertLevelLabel } from "@/features/run/lib/alert-level-label";

describe("alertLevelLabel", () => {
  it("maps levels to display labels", () => {
    expect(alertLevelLabel("info")).toBe("Info");
    expect(alertLevelLabel("warning")).toBe("Warning");
    expect(alertLevelLabel("error")).toBe("Error");
  });
});
