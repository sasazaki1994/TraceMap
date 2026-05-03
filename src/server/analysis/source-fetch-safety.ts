export type SourceFetchSafetyResult =
  | { kind: "ok" }
  | {
      kind: "blocked";
      reason:
        | "invalid_url"
        | "unsupported_protocol"
        | "localhost"
        | "private_ipv4"
        | "loopback_ipv4"
        | "link_local_ipv4"
        | "metadata_ip"
        | "loopback_ipv6"
        | "private_or_link_local_ipv6";
      message: string;
    };

function parseUrlForSafety(rawUrl: string):
  | { kind: "ok"; hostname: string }
  | { kind: "invalid_url" }
  | { kind: "unsupported_protocol" } {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { kind: "unsupported_protocol" };
    }
    if (!url.hostname) {
      return { kind: "invalid_url" };
    }
    return { kind: "ok", hostname: url.hostname };
  } catch {
    return { kind: "invalid_url" };
  }
}

function parseIpv4(hostname: string): [number, number, number, number] | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return null;
  }
  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }
    return Number.parseInt(part, 10);
  });
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets as [number, number, number, number];
}

function block(
  reason: Extract<SourceFetchSafetyResult, { kind: "blocked" }>["reason"],
  message: string,
): SourceFetchSafetyResult {
  return { kind: "blocked", reason, message };
}

export function assertSourceFetchSafe(hostname: string): SourceFetchSafetyResult {
  const normalized = hostname.trim().toLowerCase();
  const ipv6 = normalized.replace(/^\[/, "").replace(/\]$/, "");

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return block("localhost", "Localhost hostnames are not safe to fetch.");
  }

  const ipv4 = parseIpv4(normalized);
  if (ipv4) {
    const [a, b, c, d] = ipv4;
    if (a === 169 && b === 254 && c === 169 && d === 254) {
      return block("metadata_ip", "Cloud metadata IP is not safe to fetch.");
    }
    if (a === 127) {
      return block("loopback_ipv4", "Loopback IPv4 addresses are not safe to fetch.");
    }
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return block("private_ipv4", "Private IPv4 addresses are not safe to fetch.");
    }
    if (a === 169 && b === 254) {
      return block("link_local_ipv4", "Link-local IPv4 addresses are not safe to fetch.");
    }
    return { kind: "ok" };
  }

  if (!ipv6.includes(":")) {
    return { kind: "ok" };
  }

  if (ipv6 === "::1" || ipv6 === "0:0:0:0:0:0:0:1") {
    return block("loopback_ipv6", "Loopback IPv6 addresses are not safe to fetch.");
  }
  if (
    ipv6.startsWith("fe80:") ||
    ipv6.startsWith("fc") ||
    ipv6.startsWith("fd") ||
    ipv6 === "::"
  ) {
    return block(
      "private_or_link_local_ipv6",
      "Private or link-local IPv6 addresses are not safe to fetch.",
    );
  }

  return { kind: "ok" };
}

export function isSourceFetchSafe(rawUrl: string): SourceFetchSafetyResult {
  const parsed = parseUrlForSafety(rawUrl);
  if (parsed.kind === "invalid_url") {
    return block("invalid_url", "Source URL is not a valid absolute URL.");
  }
  if (parsed.kind === "unsupported_protocol") {
    return block("unsupported_protocol", "Only http and https source URLs are safe to fetch.");
  }
  return assertSourceFetchSafe(parsed.hostname);
}
