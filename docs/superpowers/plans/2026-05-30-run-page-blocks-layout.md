# Run Page Blocks Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the circular ring countdown on the run page with a solid colored block square for the current exercise, a smaller square for the next block, and extend the audio countdown from 3 to 5 seconds with a long end-of-block beep.

**Architecture:** Two files change. `src/lib/audio.ts` gains `playLongBeep()` and an expanded countdown freqs array. `src/components/Run.tsx` updates the timer worker message handler and rewrites the `RunRing` function (the default and only user-facing layout) to render stacked colored squares instead of an SVG ring.

**Tech Stack:** React 18, TypeScript, Web Audio API, Vite (no test framework — verification is TypeScript build + manual dev-server check)

---

### Task 1: Add `playLongBeep` and expand countdown in audio.ts

**Files:**
- Modify: `src/lib/audio.ts`

- [ ] **Step 1: Add `playLongBeep` after `playBlockEnd`**

In `src/lib/audio.ts`, replace:

```ts
export function playBlockEnd(): void {
  tone(660, 0.15, 0.3);
}
```

with:

```ts
export function playBlockEnd(): void {
  tone(660, 0.15, 0.3);
}

export function playLongBeep(): void {
  tone(660, 0.6, 0.45);
}
```

- [ ] **Step 2: Expand `playCountdownBeep` freqs from 3 to 5 entries**

Replace:

```ts
export function playCountdownBeep(beepNumber: number): void {
  const freqs = [880, 770, 660];
  tone(freqs[beepNumber] ?? 660, 0.1, 0.4);
}
```

with:

```ts
export function playCountdownBeep(beepNumber: number): void {
  const freqs = [880, 770, 680, 620, 560];
  tone(freqs[beepNumber] ?? 560, 0.1, 0.4);
}
```

(5 entries, descending — index 0 is the furthest-out beep at 5s, index 4 is the final beep at 1s)

- [ ] **Step 3: Verify TypeScript compiles**

```
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```
git add src/lib/audio.ts
git commit -m "feat: add playLongBeep and expand countdown beeps to 5 seconds"
```

---

### Task 2: Update timer logic and imports in Run.tsx

**Files:**
- Modify: `src/components/Run.tsx` (lines 3–4 and lines 69–82)

- [ ] **Step 1: Update the audio import**

Replace line 4:

```ts
import { initAudio, playBlockStart, playBlockEnd, playRestChime, playCountdownBeep, playCompletion } from '../lib/audio';
```

with:

```ts
import { initAudio, playBlockStart, playLongBeep, playRestChime, playCountdownBeep, playCompletion } from '../lib/audio';
```

(`playBlockEnd` removed, `playLongBeep` added)

- [ ] **Step 2: Extend countdown window from 3 s to 5 s**

In the worker `onmessage` handler (around line 69), replace:

```ts
      // Countdown beeps in last 3 seconds
      const remRound = Math.ceil(rem);
      if (remRound <= 3 && remRound > 0) {
        playCountdownBeep(3 - remRound);
      }
```

with:

```ts
      // Countdown beeps in last 5 seconds
      const remRound = Math.ceil(rem);
      if (remRound <= 5 && remRound > 0) {
        playCountdownBeep(5 - remRound);
      }
```

- [ ] **Step 3: Replace `playBlockEnd()` with `playLongBeep()`**

In the same handler (around line 76), replace:

```ts
        // Advance
        playBlockEnd();
```

with:

```ts
        // Advance
        playLongBeep();
```

- [ ] **Step 4: Verify TypeScript compiles**

```
npm run build
```

Expected: no errors. If `playBlockEnd` is now unused anywhere else, TypeScript will not error (it was only called in one place). Confirm `playBlockEnd` is no longer referenced anywhere:

```
grep -n "playBlockEnd" src/components/Run.tsx
```

Expected: no matches.

- [ ] **Step 5: Commit**

```
git add src/components/Run.tsx
git commit -m "feat: extend countdown to 5s and replace block-end sound with long beep"
```

---

### Task 3: Rewrite RunRing as blocks layout

**Files:**
- Modify: `src/components/Run.tsx` — replace `RunRing` function body (lines 223–271)

Context: `RunRing` receives these props (from `LayoutProps`):
- `current: FlatBlock | undefined` — active block, has `.color`, `.name`, `.type`, `._ctx`
- `next: FlatBlock | undefined` — next block, has `.color`, `.name`, `.type`, `.duration`
- `remaining: number` — seconds left in current block
- `ink: string` — pre-computed text color for current block (parent computes this)
- `bgColor: string` — same as `current.color`, convenience alias
- `isPrep: boolean` — true when block type is `'prepare'`
- `compact: boolean` — true when the map panel is open (shrink everything)
- `BLOCK_DEFAULTS` is already imported from `'../lib/helpers'`
- `fmt` is already imported from `'../lib/helpers'`

- [ ] **Step 1: Replace the entire `RunRing` function**

Replace the current `RunRing` function (from `function RunRing(` through the closing `}`) with:

```tsx
function RunRing({ current, next, remaining, ink, bgColor, isPrep, compact }: LayoutProps) {
  const maxSize = compact ? 220 : 340;
  const nextInk = next
    ? (next.type === 'rest' || next.type === 'transition'
        ? '#F4EFE2'
        : (BLOCK_DEFAULTS[next.type ?? 'work']?.ink ?? '#0F0F11'))
    : '#0F0F11';

  return (
    <div style={{ padding: compact ? '0 16px 0 20px' : '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

      {/* Current block square */}
      <div
        style={{
          width: '100%',
          maxWidth: maxSize,
          aspectRatio: '1 / 1',
          background: bgColor,
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background .4s ease',
          flexShrink: 0,
        }}
      >
        <div className="t-num" style={{ fontSize: compact ? 62 : 80, lineHeight: 1, color: ink }}>
          {fmt(remaining)}
        </div>
        <div style={{
          marginTop: 8,
          fontSize: compact ? 14 : 18,
          fontWeight: 600,
          color: ink,
          opacity: 0.8,
          textAlign: 'center',
          padding: '0 16px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}>
          {isPrep ? 'Starting in…' : current?.name}
        </div>
      </div>

      {/* Context pills (repeat counters) */}
      {(current?._ctx ?? []).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          {(current?._ctx ?? []).map((c, i) => (
            <div key={i} className="pill pill--gold" style={{ fontSize: 11 }}>
              {c.name} · {c.cur} of {c.total}
            </div>
          ))}
        </div>
      )}

      {/* Next block square */}
      {next && (
        <div
          style={{
            width: '48%',
            maxWidth: compact ? 106 : 163,
            aspectRatio: '1 / 1',
            background: next.color,
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background .4s ease',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: nextInk, opacity: 0.7, marginBottom: 4 }}>
            Up next
          </div>
          <div style={{
            fontSize: compact ? 11 : 13,
            fontWeight: 600,
            color: nextInk,
            textAlign: 'center',
            padding: '0 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>
            {next.name}
          </div>
          <div className="t-mono" style={{ fontSize: 11, color: nextInk, opacity: 0.7, marginTop: 2 }}>
            {fmt(next.duration)}
          </div>
        </div>
      )}

    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npm run build
```

Expected: no errors. The unused `blockProgress` and `overallProgress` props in the `layoutProps` object in `Run` are fine — they are still passed but simply not destructured by `RunRing`. The `ring-wrap` and `center` CSS class names from the old SVG layout are no longer used; this is intentional — the new layout uses flexbox and does not need them.

- [ ] **Step 3: Start dev server and visually verify**

```
npm run dev
```

Open the app, run any timer. Verify:
- Current block shows as a large colored square with the countdown number and block name centered inside
- Square color matches the block's color
- Text is readable (ink color contrasts with background)
- A smaller square appears below with the next block's color, name, duration, and "Up next" label
- When there is no next block (last block), the smaller square is absent
- When the map panel is open (compact mode), both squares shrink
- No SVG ring is visible

- [ ] **Step 4: Commit**

```
git add src/components/Run.tsx
git commit -m "feat: replace ring layout with colored block squares on run page"
```
