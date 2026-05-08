export function safeMarkdownFileName(base: string): string {
  const normalized = base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${normalized || "tracemap-report"}.md`;
}
