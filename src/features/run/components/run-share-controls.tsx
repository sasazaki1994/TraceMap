"use client";

import { useActionState, useMemo } from "react";

import {
  createShareLinkAction,
  type CreateShareLinkState,
} from "@/app/actions/create-share-link";
import { Panel } from "@/components/ui/panel";

const initialState: CreateShareLinkState = {};

type RunShareControlsProps = {
  analysisRunId: string;
};

export function RunShareControls({ analysisRunId }: RunShareControlsProps) {
  const [state, formAction, isPending] = useActionState(
    createShareLinkAction,
    initialState,
  );

  const shareUrl = useMemo(() => {
    if (!state.token || typeof window === "undefined") {
      return null;
    }
    return `${window.location.origin}/share/${state.token}`;
  }, [state.token]);

  return (
    <Panel className="run-share-panel">
      <div className="eyebrow">Share</div>
      <p className="muted" style={{ marginTop: 8, marginBottom: 12 }}>
        Create a read-only link so others can view this run without signing in.
      </p>
      <form action={formAction}>
        <input name="analysisRunId" type="hidden" value={analysisRunId} />
        <button disabled={isPending} type="submit">
          {isPending ? "Creating…" : "Create share link"}
        </button>
      </form>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {shareUrl ? (
        <p
          className="share-url-line"
          data-testid="share-url"
          style={{ marginTop: 16, wordBreak: "break-all" }}
        >
          {shareUrl}
        </p>
      ) : null}
    </Panel>
  );
}
