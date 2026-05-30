# Handoff: Duration Stepper Implementation

## Status
Plan written. Implementation NOT started. Ready to execute via subagent-driven development.

## What We're Building
Two fixes to `src/components/BlockEditor.tsx`:
1. **Smart stepper snapping** — ±5 buttons always land on multiples of 5, even from arbitrary values
2. **Tap-to-type inline input** — tapping the MM:SS display opens an editable input that accepts plain seconds ("90") or MM:SS ("1:30")

Applies to: block duration stepper (in `BlockSetup`) AND rest-between-reps stepper (in `RepeatEditor`).

## Files
- **Spec:** `docs/superpowers/specs/2026-05-29-duration-stepper-design.md`
- **Plan:** `docs/superpowers/plans/2026-05-29-duration-stepper.md`

## Plan Summary (3 tasks)

### Task 1 — Add helpers + `DurationStepper` component to `BlockEditor.tsx`
- Add `import { useState } from 'react';` at top of file
- Add 3 helpers before `BlockSetup`:
  - `parseDuration(raw: string): number | null` — accepts "90" or "1:30", returns seconds
  - `snapDecrement(current, min)` — `Math.max(min, current % 5 === 0 ? current - 5 : Math.floor(current / 5) * 5)`
  - `snapIncrement(current, max)` — `Math.min(max, current % 5 === 0 ? current + 5 : Math.ceil(current / 5) * 5)`
- Add `DurationStepper` component (uses `useState` for `editing`/`draft`): renders `.stepper` with clickable `.val` that toggles to `<input autoFocus>` on tap; blur/Enter commits, Escape reverts
- Commit

### Task 2 — Replace `BlockSetup` duration stepper
- Replace the raw stepper markup with `<DurationStepper value={block.duration} onChange={(v) => onChange((b) => { if (b.type !== 'repeat') b.duration = v; })} />`
- Commit

### Task 3 — Replace `RepeatEditor` rest-between-reps stepper
- Replace the raw stepper markup inside `{block.restBetweenReps && ...}` with `<DurationStepper value={block.restBetweenReps.duration} onChange={(v) => onChange((b) => { if (b.type === 'repeat' && b.restBetweenReps) b.restBetweenReps.duration = v; })} />`
- Type-check: `npx tsc --noEmit`
- Run dev server and verify behavior manually
- Commit + push

## Key Implementation Details
- `DurationStepper` is defined inside `BlockEditor.tsx` (no new file needed)
- `DurationStepper` interface: `{ value: number; onChange: (v: number) => void; min?: number; max?: number }` with defaults `min=1, max=3600`
- The inline input is pre-filled with `String(value)` (plain seconds, e.g. "30" not "00:30")
- On commit, `parseDuration` result must satisfy `parsed !== null && parsed >= min && parsed <= max`; otherwise silently revert
- The `.val` div gets `onClick={startEdit}` and `style={{ cursor: 'text' }}`
- Input styling: `width:72, textAlign:center, background:transparent, border:none, borderBottom:'1px solid var(--gold)', color:'var(--ink)', fontFamily:'var(--f-mono)', fontSize:'inherit', outline:none, padding:'2px 0'`

## Next Action
Invoke `superpowers:subagent-driven-development` skill and execute the plan at `docs/superpowers/plans/2026-05-29-duration-stepper.md`.
