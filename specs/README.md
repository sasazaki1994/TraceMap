# Specs

`specs/` stores feature-facing specification documents for TraceMap.

## Purpose

- Define the intent, scope, and boundaries of each feature before implementation.
- Keep product, design, and engineering aligned around a shared artifact.
- Make later PR review and CodeRabbit feedback easier by clarifying expected behavior.

## Recommended Structure

Each feature spec should describe:

1. Problem statement
2. User value
3. Scope and non-goals
4. Data and API implications
5. UI states
6. Acceptance references

## Workflow

1. Start from a new spec in `specs/`.
2. Link or mirror the acceptance scenarios in `acceptance/`.
3. Implement the feature from the spec, not from ad hoc notes.

## Current feature specs

| Spec | Document |
|------|----------|
| Question → answer graph (mock slice) | [question-to-answer-graph.md](./question-to-answer-graph.md) |
| Source detail & sharing | [source-detail-and-sharing.md](./source-detail-and-sharing.md) |
| Visual design (cyber) | [visual-design-system-cyber.md](./visual-design-system-cyber.md) |
| MVP evidence domain (claims / alerts / counterpoints) | [mvp-evidence-domain.md](./mvp-evidence-domain.md) |
