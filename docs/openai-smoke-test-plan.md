# OpenAI Smoke Test Plan (Public Beta)

## Purpose
Validate minimum production-safe behavior for the OpenAI provider path without changing provider schema or pipeline architecture.

## Preconditions
- `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai`
- `TRACEMAP_OPENAI_API_KEY` (or `OPENAI_API_KEY`) is set
- `TRACEMAP_OPENAI_MODEL` is set (recommended: `gpt-4o-mini`)
- PostgreSQL is reachable and migrations are applied
- User can sign in with beta access code

## Topics
1. **Company research**  
   `トヨタ自動車のEV戦略について、成長要因・リスク・競合状況・未確認事項を公開情報ベースで根拠付きで整理する`
2. **Technical research**  
   `RAGとAIエージェントの違いを、技術的主張・根拠・未確認点に分解して整理する`
3. **Market research**  
   `国内生成AI市場の主要プレイヤーを比較し、市場機会・リスク・不明点を公開情報ベースで整理する`

## Success Criteria
- run status is `completed`
- at least 2 sources are saved
- source URLs are valid `http`/`https`
- at least 1 claim is saved
- at least 1 claim has source linkage
- Evidence Map renders
- Unknown Map renders
- Source Lineage and Source Quality render
- Briefing Report renders
- Markdown copy/download actions work
- No investment advice-like expression (buy/sell recommendation, price target certainty)

## Failure Criteria
- Missing OpenAI API key crashes whole app
- `sufficient_grounding=false` run is treated as `completed`
- Invalid/fake source URLs are persisted
- Claims are not linked to sources
- Raw JSON parse/provider stack errors are exposed to end users
- Failed run UI is broken
- Advice-like expressions are generated in report text

## Execution Record Template
| topic | result | run status | source count | claim count | evidence map | unknown map | failure message | notes |
|---|---|---|---:|---:|---|---|---|---|
| Company research | PASS/FAIL/SKIPPED |  |  |  | rendered/not rendered | rendered/not rendered |  |  |
| Technical research | PASS/FAIL/SKIPPED |  |  |  | rendered/not rendered | rendered/not rendered |  |  |
| Market research | PASS/FAIL/SKIPPED |  |  |  | rendered/not rendered | rendered/not rendered |  |  |

## No-Key Handling
When API key is unavailable, do not force failing runs. Record as:

- OpenAI smoke test: SKIPPED
- Reason: `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` is not set.


## Pre-run checklist
- `DATABASE_URL` is set
- migrations are applied
- `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai`
- `TRACEMAP_OPENAI_API_KEY` or `OPENAI_API_KEY` is set
- `TRACEMAP_OPENAI_MODEL` is set
- beta login works
- app can create a mock run before OpenAI testing

## Suggested command context
Do not commit secrets.

```bash
TRACEMAP_ANSWER_GRAPH_PROVIDER=openai
TRACEMAP_OPENAI_MODEL=gpt-4o-mini
TRACEMAP_OPENAI_API_KEY=... pnpm dev
```

## UI execution steps
1. Sign in with beta access code.
2. Start a run with each smoke topic (company / technical / market).
3. Confirm run status, claims, source links, Unknown Map, Source Lineage, Source Quality, and Briefing Report.
4. Confirm failed runs show safe copy and do not expose raw stack traces.

## Post-run record items
- run id
- run status
- source count
- claim count
- sufficient grounding pass/fail
- advice-like expression check
- safety copy check
- any blocker for GO/NO-GO decision

## Secret handling
- Never paste API keys into git-managed files.
- Never include raw API key values in terminal logs, screenshots, or validation reports.
- Record only whether key was set/unset.

## Failure triage
| Symptom | Likely area | Action |
|---|---|---|
| API key missing | env | set key or record SKIPPED |
| run failed with insufficient grounding | provider/model output | accepted failure if safe UI appears |
| invalid URL persisted | provider validation | NO-GO |
| claim has no source link | structured output / validation | NO-GO |
| raw stack trace visible | UI failure handling | NO-GO |
| report has advice-like copy | safety copy/provider prompt | NO-GO |
