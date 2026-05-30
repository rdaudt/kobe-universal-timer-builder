# Duration Stepper: Smart Snapping + Tap-to-Type

**Date:** 2026-05-29  
**Status:** Approved

## Problem

1. The ±5 stepper can leave the duration at 1 (the enforced minimum), then adding 5 yields 6, 11, 16 — non-multiples of 5 that look wrong.
2. Users have no way to enter arbitrary durations (e.g. 7s, 23s, 47s) without many button taps.

## Scope

Both duration steppers in `BlockEditor.tsx`:
- Block duration (in `BlockSetup`)
- Rest Between Reps duration (in `RepeatEditor`)

## Design

### 1. Smart Stepper Snapping

Replace flat ±5 arithmetic with snap-to-multiple-of-5 in both directions.

**Decrement formula:**
```
Math.max(1, current % 5 === 0 ? current - 5 : Math.floor(current / 5) * 5)
```

**Increment formula:**
```
Math.min(3600, current % 5 === 0 ? current + 5 : Math.ceil(current / 5) * 5)
```

Examples:
- 30 → `−` → 25, `+` → 35
- 5 → `−` → 1, `+` → 10
- 1 → `−` → 1 (floor), `+` → 5
- 7 → `−` → 5, `+` → 10
- 11 → `−` → 10, `+` → 15

### 2. Tap-to-Type Inline Input

The `MM:SS` display inside the stepper becomes tappable. On tap:
- The display is replaced by a text `<input>` pre-filled with the current value in **plain seconds** (e.g. `30`).
- The keyboard opens on mobile.

On **blur** or **Enter**:
- Parse the input:
  - If it contains `:` → treat as `MM:SS`: `parseInt(parts[0]) * 60 + parseInt(parts[1])`
  - Otherwise → treat as plain seconds: `parseInt(value)`
- Validate: result must be a finite integer in [1, 3600].
- If valid: call `onChange` with the new duration, exit edit mode.
- If invalid or empty: revert silently to the previous value, exit edit mode.

On **Escape**: revert and exit edit mode.

### 3. DurationStepper Component

Extract a self-contained `DurationStepper` component inside `BlockEditor.tsx` that owns the edit-mode toggle state. Interface:

```ts
interface DurationStepperProps {
  value: number;            // current duration in seconds
  onChange: (v: number) => void;
  min?: number;             // default 1
  max?: number;             // default 3600
}
```

Both `BlockSetup` and `RepeatEditor` replace their current stepper markup with `<DurationStepper>`.

The component renders the existing `.stepper` CSS class and `.val` element so visual appearance is unchanged except the value becomes tappable.

## Files Changed

- `src/components/BlockEditor.tsx` — add `DurationStepper` component, update `BlockSetup` and `RepeatEditor` to use it.
- No changes to `helpers.ts`, `Builder.tsx`, or CSS.

## Out of Scope

- Stepper snapping for the Repetitions counter in `RepeatEditor` (counts rounds, not seconds).
- Any new CSS beyond what's needed for the inline input.
