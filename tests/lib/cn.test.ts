import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy class names in order", () => {
    expect(cn("panel", undefined, false, "active")).toBe("panel active");
  });
});
