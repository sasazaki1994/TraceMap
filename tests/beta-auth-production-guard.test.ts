import { afterEach, describe, expect, it } from "vitest";

import { loginWithBetaAccess } from "@/server/auth/beta-auth";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  TRACEMAP_BETA_ACCESS_CODE: process.env.TRACEMAP_BETA_ACCESS_CODE,
};

afterEach(() => {
  Reflect.set(process.env, "NODE_ENV", originalEnv.NODE_ENV);
  if (originalEnv.TRACEMAP_BETA_ACCESS_CODE === undefined) {
    delete process.env.TRACEMAP_BETA_ACCESS_CODE;
  } else {
    process.env.TRACEMAP_BETA_ACCESS_CODE = originalEnv.TRACEMAP_BETA_ACCESS_CODE;
  }
});

describe("beta auth production guard", () => {
  it("throws when beta access code is not set in production", async () => {
    Reflect.set(process.env, "NODE_ENV", "production");
    delete process.env.TRACEMAP_BETA_ACCESS_CODE;

    await expect(
      loginWithBetaAccess({ email: "beta@example.com", accessCode: "tracemap-beta" }),
    ).rejects.toThrow("TRACEMAP_BETA_ACCESS_CODE is required in production.");
  });
});
