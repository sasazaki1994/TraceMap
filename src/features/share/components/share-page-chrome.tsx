import type { ReactNode } from "react";

type SharePageChromeProps = {
  children: ReactNode;
  expiresAt?: Date | null;
};

export function SharePageChrome({ children, expiresAt }: SharePageChromeProps) {
  return (
    <>
      <p className="eyebrow" data-testid="share-readonly-badge" style={{ marginBottom: "-8px" }}>
        Shared view · read-only
      </p>
      <p className="muted" style={{ marginTop: 12, marginBottom: 12 }}>
        この共有ページは閲覧専用です。編集や再実行はできません。
      </p>
      {expiresAt ? (
        <p className="muted" data-testid="share-expiry" style={{ marginTop: 0, marginBottom: 12 }}>
          Expires at: {expiresAt.toISOString()}
        </p>
      ) : null}
      {children}
    </>
  );
}

export function ShareInvalidState() {
  return (
    <div data-testid="share-invalid-state">
      <p className="eyebrow" data-testid="share-readonly-badge" style={{ marginBottom: "-8px" }}>
        Shared view · read-only
      </p>
      <p className="muted" style={{ marginTop: 12 }}>
        この共有ページは閲覧専用です。編集や再実行はできません。
      </p>
      <p style={{ marginTop: 12 }}>
        この共有リンクは無効または期限切れです。所有者に最新の共有リンクを依頼してください。
      </p>
    </div>
  );
}
