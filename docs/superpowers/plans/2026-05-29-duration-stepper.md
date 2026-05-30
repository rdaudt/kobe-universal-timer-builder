# Duration Stepper: Smart Snapping + Tap-to-Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix ±5 stepper snapping so it always lands on multiples of 5, and add tap-to-type inline editing to all duration steppers in BlockEditor.

**Architecture:** Add three pure helper functions (`parseDuration`, `snapDecrement`, `snapIncrement`) and a `DurationStepper` component — all inside `BlockEditor.tsx`. Then replace the two existing raw stepper markups (in `BlockSetup` and `RepeatEditor`) with `<DurationStepper>`.

**Tech Stack:** React 18, TypeScript 5.7, Vite (no test framework in this project — verification is `tsc --noEmit` + visual check in dev server).

---

## File Map

| File | Change |
|------|--------|
| `src/components/BlockEditor.tsx` | Add `useState` import; add `parseDuration`, `snapDecrement`, `snapIncrement` helpers; add `DurationStepper` component; update `BlockSetup` and `RepeatEditor` to use it |

---

### Task 1: Add helpers and `DurationStepper` component

**Files:**
- Modify: `src/components/BlockEditor.tsx` (top of file — add import and new code before `BlockSetup`)

- [ ] **Step 1: Add `useState` import**

  In `src/components/BlockEditor.tsx`, change line 1 from nothing (no react import currently) to add:

  ```tsx
  import { useState } from 'react';
  ```

  Insert it as the very first line of the file, before the existing `import { Icon }` line.

- [ ] **Step 2: Add the three helper functions**

  Insert these three functions immediately before the `BlockSetup` function declaration (around line 72 of the current file, after the closing `}` of `BlockEditor`):

  ```tsx
  function parseDuration(raw: string): number | null {
    const s = raw.trim();
    if (s.includes(':')) {
      const parts = s.split(':');
      const m = parseInt(parts[0], 10);
      const sec = parseInt(parts[1], 10);
      if (isNaN(m) || isNaN(sec)) return null;
      return m * 60 + sec;
    }
    const n = parseInt(s, 10);
    if (isNaN(n) || !Number.isFinite(n)) return null;
    return n;
  }

  function snapDecrement(current: number, min: number): number {
    return Math.max(min, current % 5 === 0 ? current - 5 : Math.floor(current / 5) * 5);
  }

  function snapIncrement(current: number, max: number): number {
    return Math.min(max, current % 5 === 0 ? current + 5 : Math.ceil(current / 5) * 5);
  }
  ```

- [ ] **Step 3: Add the `DurationStepper` component**

  Insert this component immediately after the three helpers above, still before `BlockSetup`:

  ```tsx
  interface DurationStepperProps {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
  }

  function DurationStepper({ value, onChange, min = 1, max = 3600 }: DurationStepperProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');

    const startEdit = () => {
      setDraft(String(value));
      setEditing(true);
    };

    const commitEdit = () => {
      const parsed = parseDuration(draft);
      if (parsed !== null && parsed >= min && parsed <= max) {
        onChange(Math.round(parsed));
      }
      setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') setEditing(false);
    };

    return (
      <div className="stepper">
        <button onClick={() => onChange(snapDecrement(value, min))}>
          <Icon name="minus" size={14} color="var(--ink-2)" />
        </button>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            style={{
              width: 72, textAlign: 'center', background: 'transparent',
              border: 'none', borderBottom: '1px solid var(--gold)',
              color: 'var(--ink)', fontFamily: 'var(--f-mono)',
              fontSize: 'inherit', outline: 'none', padding: '2px 0',
            }}
          />
        ) : (
          <div className="val" onClick={startEdit} style={{ cursor: 'text' }}>
            {fmt(value)}
          </div>
        )}
        <button onClick={() => onChange(snapIncrement(value, max))}>
          <Icon name="plus" size={14} color="var(--ink-2)" />
        </button>
      </div>
    );
  }
  ```

- [ ] **Step 4: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/BlockEditor.tsx
  git commit -m "feat: add DurationStepper component with smart snapping and tap-to-type"
  ```

---

### Task 2: Replace `BlockSetup` duration stepper

**Files:**
- Modify: `src/components/BlockEditor.tsx` — inside `BlockSetup`, replace the `<Section label="Duration">` stepper markup

- [ ] **Step 1: Replace the stepper markup in `BlockSetup`**

  In `BlockSetup`, find this block inside `<Section label="Duration">`:

  ```tsx
  <div className="stepper">
    <button onClick={() => onChange((b) => { if (b.type !== 'repeat') b.duration = Math.max(1, b.duration - 5); })}>
      <Icon name="minus" size={14} color="var(--ink-2)" />
    </button>
    <div className="val">{fmt(block.duration)}</div>
    <button onClick={() => onChange((b) => { if (b.type !== 'repeat') b.duration = Math.min(3600, b.duration + 5); })}>
      <Icon name="plus" size={14} color="var(--ink-2)" />
    </button>
  </div>
  ```

  Replace it with:

  ```tsx
  <DurationStepper
    value={block.duration}
    onChange={(v) => onChange((b) => { if (b.type !== 'repeat') b.duration = v; })}
  />
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/BlockEditor.tsx
  git commit -m "feat: use DurationStepper for block duration in BlockSetup"
  ```

---

### Task 3: Replace `RepeatEditor` rest-between-reps stepper

**Files:**
- Modify: `src/components/BlockEditor.tsx` — inside `RepeatEditor`, replace the rest-between-reps stepper markup

- [ ] **Step 1: Replace the stepper markup in `RepeatEditor`**

  In `RepeatEditor`, inside the `{block.restBetweenReps && (...)}` block, find:

  ```tsx
  <div className="stepper" style={{ marginTop: 8 }}>
    <button onClick={() => onChange((b) => { if (b.type === 'repeat' && b.restBetweenReps) b.restBetweenReps.duration = Math.max(1, b.restBetweenReps.duration - 5); })}>
      <Icon name="minus" size={14} color="var(--ink-2)" />
    </button>
    <div className="val">{fmt(block.restBetweenReps.duration)}</div>
    <button onClick={() => onChange((b) => { if (b.type === 'repeat' && b.restBetweenReps) b.restBetweenReps.duration += 5; })}>
      <Icon name="plus" size={14} color="var(--ink-2)" />
    </button>
  </div>
  ```

  Replace it with:

  ```tsx
  <div style={{ marginTop: 8 }}>
    <DurationStepper
      value={block.restBetweenReps.duration}
      onChange={(v) => onChange((b) => { if (b.type === 'repeat' && b.restBetweenReps) b.restBetweenReps.duration = v; })}
    />
  </div>
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Verify in dev server**

  ```bash
  npm run dev
  ```

  Open the app and verify:
  - Tap a block to open its editor. Check duration stepper:
    - From 30s: `−` → 25, `+` → 35
    - From 5s: `−` → 1, `+` → 10
    - From 1s: `−` stays 1, `+` → 5
    - Tap the `00:30` display → input appears pre-filled with `30`
    - Type `47` + Enter → display shows `00:47`
    - Type `1:30` + Enter → display shows `01:30`
    - Type `abc` + Enter → reverts to previous value
    - Press Escape → reverts to previous value
  - Enable "Rest Between Reps" on a repeat block and verify the same behavior on that stepper.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/BlockEditor.tsx
  git commit -m "feat: use DurationStepper for rest-between-reps in RepeatEditor"
  ```

- [ ] **Step 5: Push**

  ```bash
  git push
  ```
