# Timer Settings Sheet — Design Spec
**Date:** 2026-05-28

## Problem

The `countdownBeforeStart`, `completionSound`, `description`, and `tags` fields on a `TimerDefinition` are set at creation time and never exposed in the Builder UI. Users have no way to change the "Starting in…" countdown duration or other timer-level settings after creation.

## Solution

A bottom-sheet settings panel, triggered by a gear icon in the Builder top bar, that lets users edit all four timer-level fields inline.

---

## Trigger

A gear icon button is added to the Builder top bar, to the left of the existing Save button. It toggles a `settingsOpen: boolean` state in `Builder.tsx`.

---

## Component

**File:** `src/components/TimerSettings.tsx`

Follows the same bottom-sheet pattern as `BlockEditor`:
- Fixed full-screen overlay (dim background)
- Panel slides up from the bottom
- Drag handle at the top
- Close (`×`) button in the top-right corner
- No explicit save — all changes apply immediately via `onChange`

**Props:**
```ts
interface TimerSettingsProps {
  timer: TimerDefinition;
  onChange: (timer: TimerDefinition) => void;
  onClose: () => void;
}
```

---

## Fields

### 1. Countdown Before Start
- Label: "Countdown before start"
- Control: segmented pill selector
- Options: `Off` (0s) · `3s` · `5s` · `10s`
- Maps to `timer.countdownBeforeStart`

### 2. Completion Sound
- Label: "Completion sound"
- Control: two-option toggle
- Options: `Horn` · `None`
- Maps to `timer.completionSound` (`'completion-horn'` | `'none'`)

### 3. Description
- Label: "Description"
- Control: `<textarea>`, optional
- Placeholder: "Add notes or protocol description…"
- Max length: 200 characters
- Maps to `timer.description`

### 4. Tags
- Label: "Tags"
- Control: free-entry chip input
  - Type a tag name, press Enter or comma to add
  - Tap an existing chip to remove it
- Maps to `timer.tags: string[]`

---

## Integration in Builder

- `Builder.tsx` adds `const [settingsOpen, setSettingsOpen] = useState(false)`
- Gear icon button added to top bar (left of Save button)
- `TimerSettings` rendered conditionally when `settingsOpen` is true:
  ```tsx
  {settingsOpen && (
    <TimerSettings
      timer={timer}
      onChange={onChange}
      onClose={() => setSettingsOpen(false)}
    />
  )}
  ```

---

## Out of Scope

- Timer name editing (already handled inline by tapping the title)
- Per-block audio settings (handled in BlockEditor)
- Any persistence beyond what `onChange` already does
