import { describe, expect, it } from "vitest";

import {
  assertSourceFetchSafe,
  isSourceFetchSafe,
} from "@/server/analysis/source-fetch-safety";

describe("assertSourceFetchSafe", () => {
  it("blocks localhost hostnames", () => {
    expect(assertSourceFetchSafe("localhost")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "localhost" }),
    );
    expect(assertSourceFetchSafe("api.localhost")).toEqual(
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

  it("blocks link-local IPv4 addresses", () => {
    expect(assertSourceFetchSafe("169.254.1.2")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "link_local_ipv4" }),
    );
  });

  it("blocks IPv6 loopback, private, and link-local addresses", () => {
    expect(assertSourceFetchSafe("::1")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "loopback_ipv6" }),
    );
    expect(assertSourceFetchSafe("fd00::1")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "private_or_link_local_ipv6" }),
    );
    expect(assertSourceFetchSafe("[fe80::1]")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "private_or_link_local_ipv6" }),
    );
  });

  it("allows public hostnames and public IPv4 addresses", () => {
    expect(assertSourceFetchSafe("example.com")).toEqual({ kind: "ok" });
    expect(assertSourceFetchSafe("8.8.8.8")).toEqual({ kind: "ok" });
  });

  it("checks complete URLs before fetch", () => {
    expect(isSourceFetchSafe("https://example.com/page")).toEqual({ kind: "ok" });
    expect(isSourceFetchSafe("http://127.0.0.1/private")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "loopback_ipv4" }),
    );
    expect(isSourceFetchSafe("ftp://example.com/file")).toEqual(
      expect.objectContaining({ kind: "blocked", reason: "unsupported_protocol" }),
    );
  });
});
