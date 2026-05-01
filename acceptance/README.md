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
| Question to answer graph | `question-to-answer-graph.feature` |
| Source detail & sharing | `source-detail-and-sharing.feature` |
| Visual design (cyber) | `visual-design-system-cyber.feature` |
| Investigation Mode | `investigation-mode.feature` |
| Unknown Map and Source Lineage Lite | `unknown-map-and-source-lineage.feature` |
| Briefing Report | `briefing-report.feature` |
