# Run Page — Blocks Layout Design

**Date:** 2026-05-30
**Status:** Approved

## Background

Users reported dissatisfaction with the current timer run page. Specific feedback:
- Replace the circular ring animation with a solid colored square for the current block
- Show the next block as a smaller square below
- Replace the block-end horn sound with countdown beeps (last 5s) and a long end-of-block beep

## Approach

Rewrite the `RunRing` component in `src/components/Run.tsx` (the default and only user-facing layout) to render the blocks design. The `layout` prop and other layout variants (`RunCentered`, `RunFullbleed`) are unchanged.

## Visual Layout

### Current block square
- Dimensions: full content width, capped at ~340px, forced 1:1 aspect ratio
- Background: `block.color` (solid fill)
- Content (centered vertically and horizontally):
  - Countdown in large type (~80px, t-num class)
  - Block name in smaller type below (~18px)
- Ink color: uses the existing `ink` prop (already accounts for light/dark contrast per block type)
- Context pills (repeat counters) appear below the square, as today

### Next block square
- Dimensions: ~48% of current block width, 1:1 aspect ratio
- Background: `next.color`
- Content: "Up next" label, block name, duration
- Ink: derive the same way as current block ink (rest/transition blocks → `#F4EFE2`, otherwise use `BLOCK_DEFAULTS[type].ink`)
- Centered below the current square with ~16px gap
- Hidden when there is no next block

### Compact mode (map panel open)
Both squares shrink proportionally. Current block cap drops to ~220px.

## Audio

### Changes to `src/lib/audio.ts`
- Add `playLongBeep()`: single sustained tone, ~0.6s duration, moderate gain (~0.45), frequency 660Hz. Signals end of block.
- Expand `playCountdownBeep` freqs array from 3 entries to 5 (covering steps 0–4).

### Changes to `src/components/Run.tsx`
- Extend countdown window: change `remRound <= 3` to `remRound <= 5`, and update the beep number argument from `3 - remRound` to `5 - remRound`
- Replace `playBlockEnd()` call with `playLongBeep()` on block transition

### Unchanged
- `playBlockStart()` — beep when a non-rest block begins
- `playRestChime()` — chime when a rest block begins
- `playCompletion()` — fanfare at end of workout

## Out of Scope
- No changes to `RunCentered`, `RunFullbleed`, or `RunTimeline`
- No changes to the layout prop or App.tsx
- No changes to the completion screen
