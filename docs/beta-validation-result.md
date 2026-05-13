# TraceMap Public Beta Readiness Report

## Decision
Conditional Go

## Reason
- Public Beta wording, login-required posture, share noindex, and report disclaimer are now aligned in code/spec/acceptance.
- Core static checks pass (lint/typecheck/unit/build), but full beta E2E verification is blocked by environment limits (Playwright browser install and missing DATABASE_URL for Prisma validate).

## Beta Positioning
- Public Beta / Closed Beta: Public Beta
- Login required: Yes
- Rationale: Existing run/history/share ownership model is ownerId-based; keeping sign-in required avoids broad auth/data-model redesign before beta.

## Changed Files
- src/features/landing/components/question-intake.tsx
- src/app/login/page.tsx
- src/app/share/[token]/page.tsx
- src/features/run/lib/build-briefing-report.ts
- src/features/run/lib/build-briefing-report.test.ts
- specs/public-beta-readiness.md
- acceptance/public-beta-readiness.feature
- e2e/investigation-mode.spec.ts

## Docs / Specs / Acceptance
- Updated public-beta scope/requirements with login-required posture, copy alignment, share noindex, and beta disclaimer expectations.
- Updated acceptance with explicit Public Beta/login/disclaimer scenarios.

## UI Copy Changes
- Closed Alpha/Closed Beta wording replaced with Public Beta wording.
- Login messaging unified to “Sign in to start a beta investigation.” / “Sign in to save, revisit, and share investigations.”

## E2E Changes
- Updated legacy Closed Alpha expectation to Public Beta.
- Added landing checks for sign-in gating/disabled CTA.
- Added manual source URL validation coverage in investigation-mode spec.

## Share Page / noindex
- Added `/share/[token]` metadata robots policy with `index: false` and `follow: false`.

## Report Disclaimer
- Added `## Beta Notice` section at end of Briefing Report markdown helper with non-advice disclaimer.

## Validation Commands

| Command | Result | Notes |
|---|---|---|
| pnpm exec prisma validate | FAIL | DATABASE_URL is not set in this environment. |
| pnpm lint | PASS | - |
| pnpm typecheck | PASS | - |
| pnpm test | PASS | 203 tests passed. |
| pnpm build | PASS | Next.js build passed. |
| pnpm exec playwright install --with-deps chromium | FAIL | apt/proxy 403 prevented dependency/browser install. |
| pnpm test:e2e | FAIL | Playwright Chromium executable missing because install failed. |

## Manual Flow Results

| Flow | Result | Notes |
|---|---|---|
| Landing / login gating | PASS | Verified via updated E2E assertions and local UI copy checks. |
| Start Investigation | SKIPPED | Requires signed-in E2E run with DB-backed session in this environment. |
| Manual Source URL Intake | PASS | Validation message coverage added in E2E spec. |
| Run Detail Panels | SKIPPED | Blocked by Playwright environment/browser install failure. |
| Markdown Export | SKIPPED | Blocked by Playwright environment/browser install failure. |
| Share Create / Copy / Revoke | SKIPPED | Blocked by Playwright environment/browser install failure. |
| Public Share View | PASS | noindex metadata added; read-only badge behavior already covered by existing spec/tests. |
| Run History | SKIPPED | Blocked by Playwright environment/browser install failure. |
| Failed / queued / processing state | SKIPPED | Existing rendering paths remain; end-to-end verification blocked by browser install failure. |

## Must Fix Before Public Beta
- Run `pnpm exec prisma validate` in an environment with `DATABASE_URL` configured.
- Resolve Playwright browser/dependency install path and run `pnpm test:e2e` fully.

## Can Defer
- None identified in this patch beyond blocked environment verification.

## Metadata
- Date: 2026-05-13 (UTC)
- Branch: work
- Commit (at validation time): 67b44aea204032d7b8fa160403d753dadf79b868
- Environment: Codex container (Linux, network/proxy restricted for apt)
- Provider: mock baseline
