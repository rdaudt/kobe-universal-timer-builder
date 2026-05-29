# Timer Settings Sheet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a gear-icon-triggered bottom sheet in the Builder that lets users edit `countdownBeforeStart`, `completionSound`, `description`, and `tags` on a timer.

**Architecture:** A new `TimerSettings` component follows the identical bottom-sheet pattern used by `BlockEditor` (backdrop + slide-up panel + handle + close button). `Builder` gets a `settingsOpen` boolean state and a gear icon button in the top bar that opens the sheet. Changes apply immediately via the existing `onChange` prop — no separate save step needed.

**Tech Stack:** React 18, TypeScript, Vite — no new dependencies.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/TimerSettings.tsx` | Bottom-sheet component with all four timer-level fields |
| Modify | `src/components/Builder.tsx` | Add `settingsOpen` state, gear button, render `TimerSettings` |

---

### Task 1: Create TimerSettings component

**Files:**
- Create: `src/components/TimerSettings.tsx`

- [ ] **Step 1: Create the file with the complete component**

Create `src/components/TimerSettings.tsx` with this exact content:

```tsx
import { useState } from 'react';
import { Icon } from './Icon';
import type { TimerDefinition } from '../types';

interface TimerSettingsProps {
  timer: TimerDefinition;
  onChange: (timer: TimerDefinition) => void;
  onClose: () => void;
}

export function TimerSettings({ timer, onChange, onClose }: TimerSettingsProps) {
  const [tagInput, setTagInput] = useState('');

  const set = <K extends keyof TimerDefinition>(key: K, value: TimerDefinition[K]) =>
    onChange({ ...timer, [key]: value });

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,$/, '').trim();
    if (tag && !timer.tags.includes(tag)) set('tags', [...timer.tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag: string) =>
    set('tags', timer.tags.filter((t) => t !== tag));

  const COUNTDOWN_OPTIONS = [
    { label: 'Off', value: 0 },
    { label: '3s', value: 3 },
    { label: '5s', value: 5 },
    { label: '10s', value: 10 },
  ];

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '88%' }}>
        <div className="sheet-handle" />

        <div style={{ padding: '0 20px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="t-tag" style={{ color: 'var(--ink-3)' }}>TIMER SETTINGS</div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 24 }}>

            <Section label="Countdown Before Start">
              <div style={{ display: 'flex', gap: 6 }}>
                {COUNTDOWN_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => set('countdownBeforeStart', value)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                      background: timer.countdownBeforeStart === value ? 'var(--gold)' : 'var(--surface-2)',
                      color: timer.countdownBeforeStart === value ? 'var(--gold-ink)' : 'var(--ink-2)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--f-mono)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Completion Sound">
              <div style={{ display: 'flex', gap: 6 }}>
                {(['completion-horn', 'none'] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => set('completionSound', val)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                      background: (timer.completionSound ?? 'completion-horn') === val ? 'var(--gold)' : 'var(--surface-2)',
                      color: (timer.completionSound ?? 'completion-horn') === val ? 'var(--gold-ink)' : 'var(--ink-2)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {val === 'completion-horn' ? 'Horn' : 'None'}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Description">
              <textarea
                value={timer.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Add notes or protocol description…"
                maxLength={200}
                rows={3}
                style={{
                  width: '100%', background: 'var(--surface-2)', color: 'var(--ink)',
                  border: 'none', borderRadius: 12, padding: '10px 12px',
                  fontFamily: 'var(--f-body)', fontSize: 13, resize: 'none', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </Section>

            <Section label="Tags">
              {timer.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {timer.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => removeTag(tag)}
                      style={{
                        padding: '5px 10px', borderRadius: 20, border: 'none',
                        background: 'var(--surface-2)', color: 'var(--ink-2)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {tag} <Icon name="x" size={10} color="var(--ink-3)" />
                    </button>
                  ))}
                </div>
              )}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
                  if (e.key === 'Backspace' && !tagInput && timer.tags.length) {
                    removeTag(timer.tags[timer.tags.length - 1]);
                  }
                }}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                placeholder="Type a tag and press Enter…"
                style={{
                  width: '100%', background: 'var(--surface-2)', color: 'var(--ink)',
                  border: 'none', borderRadius: 12, padding: '10px 12px',
                  fontFamily: 'var(--f-body)', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </Section>

          </div>
        </div>

        <div style={{ padding: '14px 20px 6px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          <button onClick={onClose} className="btn btn--gold" style={{ width: '100%', padding: '14px 0', fontSize: 13 }}>
            <Icon name="check" size={15} color="var(--gold-ink)" /> Done
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="t-tag" style={{ color: 'var(--ink-3)', marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/TimerSettings.tsx
git commit -m "feat: add TimerSettings bottom sheet component"
```

---

### Task 2: Wire TimerSettings into Builder

**Files:**
- Modify: `src/components/Builder.tsx`

- [ ] **Step 1: Add import at the top of Builder.tsx**

In `src/components/Builder.tsx`, after the existing import of `BlockEditor`:

```tsx
import { BlockEditor } from './BlockEditor';
import { TimerSettings } from './TimerSettings';
```

- [ ] **Step 2: Add settingsOpen state**

In the `Builder` function body, after the existing `useState` declarations (lines ~210-212):

```tsx
const [editing, setEditing] = useState<Path | null>(null);
const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
const [nameEdit, setNameEdit] = useState(false);
const [settingsOpen, setSettingsOpen] = useState(false);
```

- [ ] **Step 3: Add gear icon button to the top bar**

Find the `<div style={{ display: 'flex', gap: 8 }}>` that wraps the Save button (around line 419). Add the gear button as the first child inside that div:

```tsx
<div style={{ display: 'flex', gap: 8 }}>
  <button
    className="btn btn--icon"
    style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.05)' }}
    onClick={() => setSettingsOpen(true)}
  >
    <Icon name="settings" size={16} color="var(--ink)" />
  </button>
  <button
    className="btn"
    style={{ padding: '8px 14px', height: 38, fontSize: 13, background: 'rgba(255,255,255,0.05)', color: 'var(--ink)' }}
    onClick={() => onChange({ ...timer, updatedAt: new Date().toISOString() })}
  >
    Save
  </button>
</div>
```

- [ ] **Step 4: Render TimerSettings conditionally**

Find the `{editing && editingBlock && ( <BlockEditor ... /> )}` block near the bottom of the Builder return (around line 506). Add the TimerSettings sheet directly after it:

```tsx
{editing && editingBlock && (
  <BlockEditor
    path={editing}
    block={editingBlock}
    onChange={(mut) => updateAt(editing, mut)}
    onClose={() => setEditing(null)}
    onDelete={() => { removeAt(editing); setEditing(null); }}
    onDuplicate={() => {
      const node = getAt(timer.sequence, editing);
      const copy = { ...JSON.parse(JSON.stringify(node)), id: uid() };
      insertAt(editing.slice(0, -1), editing[editing.length - 1] + 1, copy);
      setEditing(null);
    }}
  />
)}
{settingsOpen && (
  <TimerSettings
    timer={timer}
    onChange={onChange}
    onClose={() => setSettingsOpen(false)}
  />
)}
```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/Builder.tsx
git commit -m "feat: wire TimerSettings sheet into Builder via gear icon"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Open the app in a browser.

- [ ] **Step 2: Verify gear icon appears**

Open any timer in the Builder. Confirm a gear icon button appears to the left of Save in the top bar.

- [ ] **Step 3: Verify sheet opens and closes**

Tap the gear icon. Confirm the settings sheet slides up with four sections: Countdown Before Start, Completion Sound, Description, Tags. Tap the × or Done button — sheet closes.

- [ ] **Step 4: Verify countdown setting works**

Open settings. Change Countdown Before Start from `5s` to `Off`. Close settings. Tap Run Timer. Confirm no "Starting in…" countdown appears and the first block starts immediately.

Change back to `3s`. Run again. Confirm a 3-second "Starting in…" countdown plays before the first block.

- [ ] **Step 5: Verify tags**

Open settings. Type `HIIT` in the tag input, press Enter. Confirm `HIIT` chip appears. Type `Cardio`, press Enter. Confirm `Cardio` chip appears. Tap `HIIT` chip — it disappears. Close settings, re-open — tags are persisted.

- [ ] **Step 6: Verify description**

Open settings. Type a description. Close and re-open — text is preserved.

- [ ] **Step 7: Verify completion sound**

No automated check possible — confirm toggle visually switches between Horn and None with the gold highlight on the active option.
