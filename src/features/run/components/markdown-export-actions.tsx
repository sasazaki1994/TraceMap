"use client";

import { useEffect, useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";

type MarkdownExportActionsProps = {
  markdown: string;
  fileName: string;
  copyButtonTestId: string;
  downloadButtonTestId: string;
  copyStatusTestId: string;
};

export function MarkdownExportActions({
  markdown,
  fileName,
  copyButtonTestId,
  downloadButtonTestId,
  copyStatusTestId,
}: MarkdownExportActionsProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timer = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const handleCopy = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        setCopyStatus("failed");
        return;
      }
      await navigator.clipboard.writeText(markdown);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const handleDownload = () => {
    if (typeof document === "undefined") return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-export-actions">
      <div className="report-export-buttons">
        <button type="button" className="ghost-button" data-testid={copyButtonTestId} onClick={handleCopy}>
          Copy Markdown
        </button>
        <button
          type="button"
          className="ghost-button"
          data-testid={downloadButtonTestId}
          onClick={handleDownload}
        >
          Download .md
        </button>
      </div>
      <p data-testid={copyStatusTestId} aria-live="polite" role="status" className="report-copy-status">
        {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : ""}
      </p>
    </div>
  );
}
