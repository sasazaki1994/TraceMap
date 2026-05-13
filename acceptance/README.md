# Acceptance

`acceptance/` stores Gherkin-style scenarios that define observable product behavior.

## Purpose

- Capture behavior in a reviewable, plain-language format.
- Support Tsumiki-style spec-driven delivery with explicit acceptance criteria.
- Provide a stable checklist for manual QA, automation, and review tooling.

## Conventions

- One feature file per feature slice.
- Keep scenarios concrete and user-observable.
- Prefer business language over implementation details.

## Feature files

| Area | File |
|------|------|
| Investigation Mode | `investigation-mode.feature` |
| Investigation Depth Mode v0.1 | `investigation-depth-mode.feature` |
| MVP evidence domain | Existing E2E coverage for claims / alerts / graph behavior |
| Source detail & sharing | `source-detail-and-sharing.feature` |
| Visual design (cyber) | `visual-design-system-cyber.feature` |
| Unknown Map and Source Lineage Lite | `unknown-map-and-source-lineage.feature` |
| Briefing Report | `briefing-report.feature` |
| Company Research Report Mode | `company-research-report.feature` |
| Report Export Lite | `report-export-lite.feature` |
| Real Investigation Pipeline | `real-investigation-pipeline.feature` |
| Cost and Output Limits | `cost-and-output-limits.feature` |
| Source Cache and Fetch Snapshot | `source-cache-and-fetch-snapshot.feature` |
| Run Cache | `run-cache.feature` |
| Source Intake and Fetching v0.1 | `source-intake-and-fetching.feature` |
| Source Discovery v0.1 | `source-discovery.feature` |
| Manual Source URL Intake v0.1 | `manual-source-url-intake.feature` |
| Run History and Saved Investigations | `run-history-and-saved-investigations.feature` |
| Share Link Management Lite | `share-link-management-lite.feature` |
| Public Beta Readiness | `public-beta-readiness.feature` |

| Source Quality & Freshness Inspector v0.1 | `source-quality-and-freshness-inspector.feature` |

| Closed Beta Readiness v0.1 (incremental) | `closed-beta-readiness.feature` |
| Basic Auth and Owner Scope | `basic-auth-and-owner-scope.feature` |

| Source Quality and Evidence Accuracy | `source-quality-and-evidence-accuracy.feature` |
| Source Detail Evidence Drilldown | `source-detail-evidence-drilldown.feature` |
| Unknown Map Categorization | `unknown-map-categorization.feature` |
| Report Export and Templates | `report-export-and-templates.feature` |

| Unknown Map Categorization & Deduplication | `unknown-map-categorization-and-deduplication.feature` |
