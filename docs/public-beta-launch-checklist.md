# Public Beta Launch Checklist

## Release posture

- Public Beta として公開する
- 正式版ではない
- 出力は必ずユーザー確認が必要
- 投資助言、法務助言、医療助言ではない
- 生成AIの出力には誤りが含まれる可能性がある
- 根拠・不明点・出典を確認してから再利用する

## Required before GO

| Item | Required | Status | Notes |
|---|---:|---|---|
| pnpm lint | yes | TODO | |
| pnpm typecheck | yes | TODO | |
| pnpm test | yes | TODO | |
| pnpm build | yes | TODO | |
| DATABASE_URL付き prisma validate | yes | TODO | |
| pnpm test:e2e | yes | TODO | 別タスク |
| OpenAI 3テーマ smoke test | yes | TODO | 別タスク |
| Production env vars checked | yes | TODO | |
| Share read-only checked | yes | TODO | |
| Share noindex/nofollow checked | yes | TODO | |
| Owner scope checked | yes | TODO | |
| Non-advice statement checked | yes | TODO | |
| Failed run safe copy checked | yes | TODO | |

## Required environment variables

Always required:

- DATABASE_URL
- TRACEMAP_SESSION_SECRET
- TRACEMAP_BETA_ACCESS_CODE
- TRACEMAP_ANSWER_GRAPH_PROVIDER

Conditionally required (only when running OpenAI smoke tests, or when `TRACEMAP_ANSWER_GRAPH_PROVIDER` is set to an OpenAI-backed provider):

- TRACEMAP_OPENAI_API_KEY or OPENAI_API_KEY
- TRACEMAP_OPENAI_MODEL
- TRACEMAP_OPENAI_TIMEOUT_MS

Note:
- If OpenAI keys are not set, record OpenAI smoke as `SKIPPED` with reason (`TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` not set), and keep GO/NO-GO evidence explicit.

## Recommended beta settings

- Keep beta access code enabled
- Keep Public Beta copy visible
- Keep share pages noindex/nofollow
- Keep mock provider available for fallback/demo
- Do not enable billing
- Do not claim production-grade accuracy
- Do not advertise investment recommendation usage

## GO criteria

Public Beta can be marked GO only when:

- Static checks pass
- Unit/build checks pass
- Prisma validate passes with DATABASE_URL
- E2E passes in a browser-capable environment
- OpenAI 3-topic smoke test passes or documented failure is accepted explicitly
- Safety guard checks pass
- Validation docs are updated from NO-GO to GO

## NO-GO criteria

- E2E not executed
- OpenAI smoke test not executed
- owner scope broken
- share page exposes mutation controls
- share page allows indexing
- provider failure crashes the app
- failed run exposes raw stack traces
- reports include buy/sell recommendation or target price certainty
