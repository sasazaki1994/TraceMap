# Public Beta Failure State / Error UX Hardening Audit

Date: 2026-05-19  
Scope: pre-public-beta failure-state safety audit (no schema/provider major redesign)

## Audit result summary

17 target failure patterns were reviewed against current code paths. Most patterns were already handled with safe fallback UX and owner-scope protections. One hardening gap was found: unexpected provider/persistence exceptions could surface raw internal error messages via `lastErrorMessage` on failed run pages.

A minimal fix was applied to store a generic safe message for thrown provider/persistence exceptions.

## Pattern-by-pattern findings

1. Unauthenticated user starts investigation: guarded by current user check in server action/page flow.
2. Invalid beta access code: login action validates and returns safe auth error state.
3. Missing `TRACEMAP_SESSION_SECRET` in production: startup guard throws explicit config error.
4. Missing `TRACEMAP_BETA_ACCESS_CODE` in production: startup guard throws explicit config error.
5. Missing OpenAI API key: provider returns failure without provider call and with setup message.
6. OpenAI provider exception: failure path exists; **hardened** thrown-exception message storage.
7. `sufficient_grounding=false`: normalized to explicit failure reason/message.
8. Invalid JSON from OpenAI: provider returns safe parse failure message.
9. Source URL non-http/https: normalization validation rejects payload.
10. Fewer than two sources: normalization validation rejects payload.
11. Claim missing source references: normalization validation rejects payload.
12. Invalid manual source URL: intake validation/normalization filters and ignores invalid candidates safely.
13. Failed run status: run/share pages show failure banner and avoid rendering partial broken graph.
14. Queued/processing run status: run/share pages show non-blocking processing status banner.
15. Missing share token: invalid share state rendered (safe fallback).
16. Expired share link: invalid share state rendered (safe fallback).
17. Accessing another user’s run: owner scope check returns notFound.

## Minimal hardening applied

- `createAnalysisRunFromProvider` now stores a fixed safe message when an unexpected exception occurs in provider execution or answer-graph persistence.
- Provider-declared failure messages (already curated) remain unchanged.

## Added tests

- Added unit test to verify thrown provider exceptions do not persist raw internal messages and instead persist a safe generic run failure message.

## Remaining risks

- Curated provider failure messages are still surfaced to users by design; if wording policy tightens further, a centralized UI-safe message mapper should be introduced in a separate task.
- Console logs still retain exception causes for operators (intended), so operational log-access controls remain important.
