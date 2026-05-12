# Basic Auth and Owner Scope v0.1

## Purpose
Add closed-beta authentication and per-user owner scope for private runs.

## User value
Users can safely keep private investigations private while still sharing explicit public links.

## Scope
- Minimal beta login via email + access code
- Session cookie auth
- `AnalysisRun.ownerId` ownership
- owner-only `/runs`, `/runs/[id]`, share create/revoke
- `/share/[token]` remains public read-only

## Non-goals
- Team / Organization / RBAC
- Billing account
- SSO
- OAuth provider の網羅対応
- Password reset
- Email verification
- Admin console
- Audit log full implementation
- Permanent deletion workflow
- Public user profile
- Investment advice features

## Authentication strategy
- Beta access code in env (`TRACEMAP_BETA_ACCESS_CODE`)
- Signed httpOnly session cookie with `sameSite=lax` and `secure` in production
- Production requires `TRACEMAP_SESSION_SECRET`; dev/test fallback allowed

## Owner scope rules
- New runs must store current user id to `ownerId`
- Run history shows only current user
- Run detail returns notFound for non-owner
- Share create/revoke allowed only to owner
- Legacy `ownerId=null` runs are excluded from private user lists/routes by default

## Data model changes
- Add `User` model and relation from `AnalysisRun.ownerId` (nullable for migration safety)

## Route protection rules
- `/login`: public
- `/`: public, but run creation requires sign-in
- `/runs`, `/runs/[id]`: authenticated + owner scope
- `/share/[token]`: public read-only

## Share link behavior
Share URLs stay anonymous and readable without authentication; management remains owner-only.

## UI requirements
- Add `/login` page (test ids defined)
- Show auth status + logout
- Show sign-in prompt when unauthenticated on landing page

## Test requirements
Unit/integration should cover login validation, owner save/filter/check, and share owner checks.

## Acceptance references
- `acceptance/basic-auth-and-owner-scope.feature`
