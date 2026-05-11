# Beta Validation

TraceMap beta v0.1 is validated as an evidence-first investigation experience centered on mission execution, traceability, and read-only sharing.

## Required commands

For local execution details and reporting format, see `docs/local-verification.md`.

- `pnpm exec prisma validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm exec playwright install --with-deps chromium` (Linux/CI) or `pnpm exec playwright install chromium` (macOS/Windows)
- `pnpm test:e2e`

## Required beta flows

Flow verification details are maintained in `docs/local-verification.md` manual checklist.

- Landing → Run Detail
- Manual Source URL Intake
- Investigation depth selection
- Run Detail panels
- Markdown export
- Share link create / copy / revoke
- Public share view
- Run history search / filter / reopen
- Failed / processing state

## Known non-goals

- Auth
- Billing
- Workspace
- RAG
- Background jobs
- Streaming
- PDF / PPT / Notion export

## Notes for local/CI execution

- Default validation should use mock provider so OpenAI API keys are not required.
- `DATABASE_URL` must be set for Prisma validation and app/runtime checks.
- If E2E cannot run due to browser/dependency install restrictions, record the exact failing command and root cause in the PR report.

## Reporting policy

- Separate failed checks into environment failures and application failures first, then classify test maintenance/provider issues if applicable.
- Use the copy-pasteable result report template in `docs/local-verification.md` for Issues/PRs.
