# Visual design system (cyber)

## Summary

TraceMap uses a **dark, cyber-inflected** UI: deep blue background, cyan/violet accents, glassy panels, and restrained typography. This spec names **design tokens** (CSS custom properties) and **component primitives** so features stay visually consistent.

## Relationship to other specs

- Applied across [question-to-answer-graph](./question-to-answer-graph.md) and [source-detail-and-sharing](./source-detail-and-sharing.md) screens.

## Design tokens (reference)

Declared in `src/app/globals.css` under `:root`. Consumers should prefer these variables over hard-coded hex values.

| Token | Role |
|-------|------|
| `--background` | Page base |
| `--background-elevated` | Panels, cards |
| `--foreground` | Primary text |
| `--muted` | Secondary text |
| `--border` | Panel / control outlines |
| `--accent` | Primary accent (cyan family) |
| `--accent-strong` | Emphasis, selection (violet) |
| `--shadow` | Panel elevation |
| `--radius` | Default corner radius |

## Typography

- **UI font**: `system-ui` stack with Inter preferred when available (`body` in `globals.css`).
- **Hierarchy**: Page titles (`h1`), section labels (`.eyebrow`), body (`.lead`, panel content).

## Components (primitives)

| Component | Path | Notes |
|-------------|------|--------|
| Page container | `src/components/ui/page-container.tsx` | Max width, horizontal padding |
| Panel | `src/components/ui/panel.tsx` | Bordered glass card; uses `.panel` |
| Run layout | `src/features/run/components/run-result-view.tsx` | Graph SVG, source list, detail aside |

## Motion and density

- MVP: **no** required motion; optional hover on `.source-list-item` and graph nodes only.

## Out of scope

- Full component library (Storybook), Figma kit, or light theme.

## Related acceptance

See `acceptance/visual-design-system-cyber.feature`.
