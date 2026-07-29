---
name: track-cursor-usage
description: >-
  Tracks and reports Cursor Agent usage for this local space-game project only
  (day-by-day prompts, tools, subagents, rough USD). Use when the user asks
  about Cursor usage, credits, spend, Agent activity, usage report, Excel
  usage file, or to refresh/update cursor-usage tracking.
---

# Track Cursor usage (space-game)

## Scope

This workspace only. Sources:

1. **Live hooks** → `cursor-usage/events.jsonl` (`.cursor/hooks.json`)
2. **Agent transcripts** → `%USERPROFILE%\.cursor\projects\<id>\agent-transcripts`

Not included: Tab, Cmd+K, indexing, other projects, official Cursor invoices.

## Refresh report (default action)

When the user asks for usage, a usage report, or to update tracking:

```bash
npm run usage:track
```

Or:

```bash
node scripts/track-cursor-usage.mjs
```

Machine-readable:

```bash
node scripts/track-cursor-usage.mjs --json
```

### Outputs

| File | Purpose |
|------|---------|
| `cursor-usage/daily.json` | Canonical day-by-day + totals |
| `cursor-usage/meta.json` | Last refresh metadata |
| `cursor-usage/report.csv` | Spreadsheet-friendly |
| `cursor-usage/report.xlsx` | Excel (needs `xlsx` devDependency) |
| `cursor-usage-space-game.xlsx` | Same report at repo root |

## How to answer the user

1. Run `npm run usage:track` first (do not invent numbers).
2. Summarize from `cursor-usage/daily.json`: active days, prompts, tools, est. mid USD.
3. Point them at `cursor-usage/report.xlsx` (or CSV).
4. State clearly: USD columns are **heuristics**, not billing. Official: https://cursor.com/dashboard/usage

## Live tracking

Hooks in `.cursor/hooks.json` append events via `.cursor/hooks/log-usage.mjs` on:

- `sessionStart` / `sessionEnd`
- `beforeSubmitPrompt`
- `stop`
- `subagentStart` / `subagentStop`
- `postToolUse`

Hooks are fail-open and do **not** store prompt text (only char counts).

If hooks seem silent: check Cursor **Settings → Hooks**, confirm project hooks loaded, restart Cursor if needed.

## Maintenance

- Do not commit secrets; usage files under `cursor-usage/` (except `.gitkeep`) are gitignored.
- After changing tracker logic, re-run `npm run usage:track` and confirm `daily.json` updates.
- Keep Excel generation optional: CSV/JSON must always succeed even without `xlsx`.
