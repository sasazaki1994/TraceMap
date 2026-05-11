"use client";

import { useActionState, useMemo, useState } from "react";

import {
  createShareLinkAction,
  type CreateShareLinkState,
} from "@/app/actions/create-share-link";
import { revokeShareLinkAction } from "@/app/actions/revoke-share-link";
import { Panel } from "@/components/ui/panel";
import { isShareLinkActive, type RunShareLinkView } from "@/features/run/share-link-status";

const initialState: CreateShareLinkState = {};

type RunShareControlsProps = {
  analysisRunId: string;
  shareLinks: RunShareLinkView[];
};

export function RunShareControls({ analysisRunId, shareLinks }: RunShareControlsProps) {
  const [state, formAction, isPending] = useActionState(createShareLinkAction, initialState);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const links = useMemo(() => {
    return state.token
      ? [
          {
            id: `new-${state.token}`,
            token: state.token,
            createdAt: new Date().toISOString(),
            expiresAt: null,
          },
          ...shareLinks,
        ]
      : shareLinks;
  }, [shareLinks, state.token]);

  const makeShareUrl = (token: string) => {
    if (typeof window === "undefined") {
      return `/share/${token}`;
    }
    return `${window.location.origin}/share/${token}`;
  };

  async function handleCopy(url: string) {
    if (typeof window === "undefined" || !navigator?.clipboard) {
      setCopyStatus("Copy unavailable in this environment.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("Copied.");
    } catch {
      setCopyStatus("Failed to copy link.");
    }
  }

  return (
    <Panel className="run-share-panel" data-testid="share-link-section">
      <div className="eyebrow">Share</div>
      <p className="muted" style={{ marginTop: 8, marginBottom: 12 }}>
        Create a read-only link so others can view this run without signing in.
      </p>
      <form action={formAction}>
        <input name="analysisRunId" type="hidden" value={analysisRunId} />
        <button data-testid="share-create-button" disabled={isPending} type="submit">
          {isPending ? "Creating…" : "Create share link"}
        </button>
      </form>
      {state.error ? (
        <p className="form-error" data-testid="share-link-create-error">
          {state.error}
        </p>
      ) : null}

      <div data-testid="share-link-list" style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {links.map((link, idx) => {
          const url = makeShareUrl(link.token);
          const active = isShareLinkActive(link.expiresAt);
          return (
            <div
              key={link.id}
              data-testid="share-link-item"
              style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}
            >
              <p data-testid="share-link-status" className="muted" style={{ marginBottom: 8 }}>
                {active ? "ACTIVE" : "EXPIRED"}
              </p>
              <p
                className="share-url-line"
                data-testid={idx === 0 ? "share-url" : "share-link-url"}
                style={{ marginBottom: 8, wordBreak: "break-all" }}
              >
                {url}
              </p>
              <p data-testid="share-link-created-at" className="muted" style={{ marginBottom: 4 }}>
                createdAt: {new Date(link.createdAt).toLocaleString()}
              </p>
              <p data-testid="share-link-expires-at" className="muted" style={{ marginBottom: 8 }}>
                expiresAt: {link.expiresAt ? new Date(link.expiresAt).toLocaleString() : "never"}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  data-testid="share-link-copy-button"
                  onClick={() => void handleCopy(url)}
                >
                  Copy
                </button>
                {active && !link.id.startsWith("new-") ? (
                  <button
                    type="button"
                    data-testid="share-link-revoke-button"
                    disabled={revokingId === link.id}
                    onClick={async () => {
                      setError(null);
                      setRevokingId(link.id);
                      try {
                        const result = await revokeShareLinkAction({
                          analysisRunId,
                          shareLinkId: link.id,
                        });
                        if (!result.ok) {
                          setError(result.error ?? "Failed to revoke link.");
                        }
                      } finally {
                        setRevokingId(null);
                      }
                    }}
                  >
                    {revokingId === link.id ? "Revoking…" : "Revoke"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {copyStatus ? <p data-testid="share-link-copy-status">{copyStatus}</p> : null}
      {error ? <p data-testid="share-link-revoke-error">{error}</p> : null}
    </Panel>
  );
}
