import { describe, expect, it } from "vitest";

import { assertSourceFetchSafe } from "@/server/analysis/source-fetch-safety";

describe("assertSourceFetchSafe", () => {
  it("blocks localhost hostnames", () => {
    expect(assertSourceFetchSafe("localhost")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "localhost" }),
    );
  });

  it("blocks 127.0.0.1", () => {
    expect(assertSourceFetchSafe("127.0.0.1")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "loopback_ipv4" }),
    );
  });

  it("blocks private IPv4 ranges", () => {
    expect(assertSourceFetchSafe("10.0.0.1")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "private_ipv4" }),
    );
    expect(assertSourceFetchSafe("172.16.0.1")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "private_ipv4" }),
    );
    expect(assertSourceFetchSafe("192.168.1.1")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "private_ipv4" }),
    );
  });

  it("blocks metadata IP", () => {
    expect(assertSourceFetchSafe("169.254.169.254")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "metadata_ip" }),
    );
  });

  it("allows public hostnames and public IPv4 addresses", () => {
    expect(assertSourceFetchSafe("example.com")).toEqual({ kind: "ok" });
    expect(assertSourceFetchSafe("8.8.8.8")).toEqual({ kind: "ok" });
  });
});
