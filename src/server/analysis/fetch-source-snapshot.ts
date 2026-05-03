import { createHash } from "node:crypto";

import { isSourceFetchSafe } from "@/server/analysis/source-fetch-safety";

export type FetchSourceSnapshotResult =
  | {
      kind: "fetched";
      requestedUrl: string;
      finalUrl: string | null;
      httpStatus: number | null;
      contentType: string | null;
      contentHash: string | null;
      excerpt: string | null;
    }
  | {
      kind: "failed";
      requestedUrl: string;
      errorMessage: string;
      httpStatus?: number | null;
      contentType?: string | null;
      finalUrl?: string | null;
    }
  | {
      kind: "blocked";
      requestedUrl: string;
      errorMessage: string;
    };

export type SourceFetchImpl = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 200_000;
const MAX_EXCERPT_CHARS = 1_200;

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getSourceFetchTimeoutMs(): number {
  return readPositiveIntEnv("TRACEMAP_SOURCE_FETCH_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
}

export function getSourceFetchMaxBytes(): number {
  return readPositiveIntEnv("TRACEMAP_SOURCE_FETCH_MAX_BYTES", DEFAULT_MAX_BYTES);
}

function isTextLikeContentType(contentType: string | null): boolean {
  if (contentType === null) {
    return true;
  }
  const type = contentType.toLowerCase();
  return (
    type.startsWith("text/") ||
    type.includes("application/json") ||
    type.includes("application/xml") ||
    type.includes("application/xhtml+xml") ||
    type.includes("+json") ||
    type.includes("+xml")
  );
}

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function buildExcerpt(text: string, contentType: string | null): string | null {
  const base = contentType?.toLowerCase().includes("html") ? stripHtml(text) : text;
  const normalized = base.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }
  return Array.from(normalized).slice(0, MAX_EXCERPT_CHARS).join("");
}

async function readBoundedBytes(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!response.body) {
    return new Uint8Array(await response.arrayBuffer()).slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) {
        break;
      }
      const remaining = maxBytes - total;
      const chunk = value.length > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      total += chunk.length;
      if (value.length > remaining) {
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function sha256(bytes: Uint8Array): string | null {
  if (bytes.length === 0) {
    return null;
  }
  return createHash("sha256").update(bytes).digest("hex");
}

export async function fetchSourceSnapshot(
  requestedUrl: string,
  options?: {
    fetchImpl?: SourceFetchImpl;
    timeoutMs?: number;
    maxBytes?: number;
  },
): Promise<FetchSourceSnapshotResult> {
  const safety = isSourceFetchSafe(requestedUrl);
  if (safety.kind === "blocked") {
    return {
      kind: "blocked",
      requestedUrl,
      errorMessage: safety.message,
    };
  }

  const fetchFn = options?.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options?.timeoutMs ?? getSourceFetchTimeoutMs();
  const maxBytes = options?.maxBytes ?? getSourceFetchMaxBytes();
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    const response = await fetchFn(requestedUrl, {
      method: "GET",
      redirect: "follow",
      signal,
      headers: {
        Accept: "text/html,text/plain,application/json,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const contentType = response.headers.get("content-type")?.trim() || null;
    const bytes = await readBoundedBytes(response, maxBytes);
    const contentHash = sha256(bytes);
    const excerpt = isTextLikeContentType(contentType)
      ? buildExcerpt(new TextDecoder("utf-8", { fatal: false }).decode(bytes), contentType)
      : null;

    return {
      kind: "fetched",
      requestedUrl,
      finalUrl: response.url || requestedUrl,
      httpStatus: response.status,
      contentType,
      contentHash,
      excerpt,
    };
  } catch (cause) {
    const errorMessage = cause instanceof Error ? cause.message : "Source fetch failed.";
    return {
      kind: "failed",
      requestedUrl,
      errorMessage,
      httpStatus: null,
      contentType: null,
      finalUrl: null,
    };
  }
}
