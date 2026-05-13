# Report Export Lite v0.1

## Purpose
Enable deterministic Briefing Report markdown reuse via copy/download actions without introducing new persistence.

## User value
- Reuse investigation output as internal memo material.
- Preserve claim-source context while exporting.
- Surface quality caveats (unknown/unchecked/stale) directly in exported markdown.

## Scope
- Deterministic markdown generation from structured run data.
- Include Executive Summary, Key Claims, Supporting Sources, Unknowns, Source Lineage, Source Quality Notes, Metadata.
- Add Copy Markdown and Download .md actions in Briefing Report panel.

## Non-goals
- PDF / PowerPoint / Notion export.
- Report template switching.
- Report editor/approval workflow.
- DB migration or report-specific table.

## Existing implementation constraints
- Do not break Evidence Map / Source Quality / Unknown Map / Source Lineage / Share.
- Keep OpenAI provider schema behavior unchanged (major changes deferred).

## Data model strategy
- Report専用DBテーブルは今回追加しない。
- Briefing Report は既存 run evidence から feature helper で生成する。
- Source Quality & Freshness Inspector の出力を reportへ反映する。
- claim-source対応を保持する。

## UI requirements
- `briefing-report-panel`, `briefing-report-markdown`, `copy-markdown-button`, `download-markdown-button`, `copy-markdown-status` test ids.
- Clipboard failure must show failure status and not crash.
- Download uses Blob client-side.

## Provider requirements
- OpenAI provider の大規模 schema 変更は次フェーズ。
- No provider/pipeline redesign.

## Safety/wording requirements
- Unknown / unchecked / stale source を verified のように表現しない。
- Avoid investment advice style wording.

## Test requirements
- Unit tests cover markdown structure, source quality reflection, runId/generatedAt metadata, and no-crash fallback behavior.

## Acceptance references
- `acceptance/report-export-lite.feature`
