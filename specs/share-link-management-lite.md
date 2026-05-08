# Share Link Management Lite v0.1

## Purpose
Provide lightweight, safe visibility and control for run-level read-only share links without changing the existing share architecture.

## User value
- Users can see existing links, not just create new ones.
- Users can confirm link status (active/expired) and dates.
- Users can quickly copy a share URL and revoke a link when needed.
- Public readers cannot open revoked/expired links.

## Scope
- Extend `/runs/[id]` share panel to show existing links and management controls.
- Support new link creation from the same panel.
- Support link revocation using existing `ShareLink.expiresAt`.
- Enforce active-link-only access on `/share/[token]`.

## Non-goals
- Authentication / owner scope
- Workspace/team sharing
- Password-protected links
- Share analytics / access logs
- Billing / quota
- RAG / background jobs / streaming
- DB schema redesign

## Existing implementation constraints
- Keep current `/share/[token]` read-only view behavior intact for active links.
- Keep Evidence Map / Unknown Map / Source Lineage / Briefing Report / Run History intact.
- Avoid broad architectural changes; implement as minimal extension.

## Data model strategy
- Reuse existing `ShareLink` table (`id`, `analysisRunId`, `token`, `createdAt`, `expiresAt`).
- No DB migration for this feature.
- Revoke is represented by setting `expiresAt = now`.
- Status rules:
  - `active`: `expiresAt === null || expiresAt > now`
  - `expired`: `expiresAt !== null && expiresAt <= now`

## UI requirements
- Share panel shows:
  - title + read-only description
  - create button
  - list of existing share links (newest first)
  - per-link URL, status badge, createdAt, expiresAt
  - copy button
  - revoke button (for active links)
- Keep compatibility with existing `data-testid="share-url"`.
- Add test IDs for panel/list/item/status/date/copy/revoke/error states.

## Server action requirements
- Add revoke server action accepting `analysisRunId` and `shareLinkId`.
- Validate required fields.
- Confirm link belongs to run before updating.
- Update `expiresAt` to current time; do not delete row.
- Revalidate run detail path after success.

## Share page requirements
- `/share/[token]` resolves only active share links.
- Expired/revoked links are not publicly readable.
- Behavior for inactive links is `notFound()` (aligned with existing route handling).

## Test requirements
- Unit tests for active/expired status helper.
- E2E scenarios for:
  - listing links on run page
  - creating link
  - opening share URL
  - revoking link
  - revoked link becoming inaccessible from `/share/[token]`

## Acceptance references
- `acceptance/share-link-management-lite.feature`
