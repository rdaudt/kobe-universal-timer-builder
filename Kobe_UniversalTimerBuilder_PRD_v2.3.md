# Kobe Universal Timer Builder
## Product Requirements Document

**Developed by:** Kobe AI Solutions
**Version:** 2.3
**Date:** May 2026
**Status:** Draft — For Review

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Foundation Blocks](#2-foundation-blocks)
3. [Container Blocks](#3-container-blocks)
4. [Timer Metadata & Data Model](#4-timer-metadata--data-model)
5. [Builder UI & Interactions](#5-builder-ui--interactions)
6. [Runtime Execution Engine](#6-runtime-execution-engine)
7. [Timer Management](#7-timer-management)
8. [Bundled Starter Timers](#8-bundled-starter-timers)
9. [UX Design Requirements](#9-ux-design-requirements)
10. [Technical Architecture](#10-technical-architecture)
11. [Milestones & Scope](#11-milestones--scope)
12. [Acceptance Criteria](#12-acceptance-criteria)

---

## 1. Product Overview

### 1.1 Purpose

The Kobe Universal Timer Builder is a PWA developed by Kobe AI Solutions. It enables users to compose custom workout timers from reusable foundation blocks arranged on a visual canvas — no configuration code, no menus, no account required.

The app behaves as close as possible to a native iOS or Android timer app. It is unauthenticated, single-user per device, and fully functional offline. All data is stored locally on the device. There are no roles, no permissions, and no server-side dependencies.

The builder replaces static, pre-defined timer modes (HIIT, Tabata, EMOM) with a flexible, general-purpose composition engine. Any interval-based protocol — from a simple 30-second countdown to a nested multi-circuit strength session — can be built, saved, and executed within the same interface.

### 1.2 Goals

- Empower any user to build any interval-based timer protocol visually, without instruction.
- Enable recursive nesting of block groups via Repeat Containers.
- Store all timers locally on the device via IndexedDB — no login, no cloud, no sync.
- Ship with a set of bundled starter timers that demonstrate the builder's capabilities and provide immediate value on first launch.
- Deliver a run-time experience that is clear, distraction-free, and audio-guided.

### 1.3 Core Principles

- **Unauthenticated.** No login, no accounts, no user profiles.
- **No roles.** Every user has access to every feature.
- **Local only.** IndexedDB is the sole persistence layer. No cloud sync, no sharing, no export in v1.0.
- **Offline first.** The app must be fully functional with no network connection after initial install.
- **Native feel.** Interactions, transitions, and performance should feel indistinguishable from a native mobile app.

### 1.4 Non-Goals (v1.0)

- User accounts, authentication, or cloud sync.
- Timer sharing or export/import.
- Social features or community timer discovery.
- Video or exercise library integration within timer blocks.
- Real-time multi-user synchronised timers.
- Wearable / Bluetooth heart-rate monitor integration.
- Coach/trainee or any role-based access model.

---

## 2. Foundation Blocks

Foundation blocks are the atomic units of a timer. Users drag them from the Block Palette onto the Builder Canvas to compose a sequence. Each block type has a distinct visual identity and semantic meaning that drives runtime display and audio cues.

### 2.1 Block Type Definitions

#### 2.1.1 Work Block

| Attribute | Type | Required | Description |
|---|---|---|---|
| name | string | Yes | Display name shown on canvas and during run (e.g. "Burpees"). |
| duration | integer (seconds) | Yes | Length of the interval. Min: 1s. Max: 3600s. |
| color | hex color | Yes | Block accent color. Defaults to brand gold `#D4A017`. |
| label | string | No | Short label shown on the run screen (e.g. "WORK"). Defaults to "WORK". |
| notes | string | No | Coach instruction displayed during execution (e.g. "Max effort, keep hips low"). |
| audioStartCue | enum | No | Tone played at block start. Options: `block-start`, `none`. Default: `block-start`. |
| audioEndCue | enum | No | Tone played at block end. Options: `block-end`, `none`. Default: `block-end`. |
| intensity | enum | No | Optional intensity tag: `low`, `medium`, `high`. Reserved for future analytics. |
| autoAdvance | boolean | No | If true, proceeds to next block automatically. Default: `true`. |

#### 2.1.2 Rest Block

| Attribute | Type | Required | Description |
|---|---|---|---|
| name | string | Yes | Display name (e.g. "Rest", "Active Recovery"). |
| duration | integer (seconds) | Yes | Length of the rest interval. Min: 1s. |
| color | hex color | Yes | Defaults to `#333333` (near-black). |
| label | string | No | Run-screen label. Defaults to "REST". |
| audioStartCue | enum | No | Tone at rest start. Options: `rest-chime`, `none`. Default: `rest-chime`. |
| autoAdvance | boolean | No | Default: `true`. If false, user taps to proceed. |

#### 2.1.3 Transition Block

| Attribute | Type | Required | Description |
|---|---|---|---|
| duration | integer (seconds) | Yes | Typically short: 3–10s. Signals movement between stations. |
| color | hex color | Yes | Defaults to `#4A90D9` (blue). |
| label | string | No | Run-screen label. Defaults to "TRANSITION". Examples: "Switch Sides", "Move to Station 2". |
| audioStartCue | enum | No | Options: `block-start`, `none`. Default: `block-start`. |

#### 2.1.4 Warmup Block

| Attribute | Type | Required | Description |
|---|---|---|---|
| duration | integer (seconds) | Yes | Typical range: 60–600s. |
| color | hex color | Yes | Defaults to `#5BA85A` (green). |
| label | string | No | Defaults to "WARM UP". |
| notes | string | No | Movement instructions shown on run screen. |
| audioStartCue | enum | No | Options: `block-start`, `none`. Default: `block-start`. |

#### 2.1.5 Cooldown Block

| Attribute | Type | Required | Description |
|---|---|---|---|
| duration | integer (seconds) | Yes | Typical range: 60–600s. |
| color | hex color | Yes | Defaults to `#7B68EE` (soft purple). |
| label | string | No | Defaults to "COOL DOWN". |
| notes | string | No | Stretch or breathing cues shown during execution. |
| audioStartCue | enum | No | Options: `block-start`, `none`. Default: `none`. |

#### 2.1.6 Prepare Block (System)

A short countdown block that fires before the timer begins and optionally before each round inside a Repeat Container. It is not dragged from the palette — it is configured at the timer level and at the Repeat Container level independently.

| Attribute | Type | Required | Description |
|---|---|---|---|
| duration | integer (seconds) | Yes | Options: 3, 5, 10. Default: 5. |
| label | string | No | Defaults to "GET READY". |
| audioStartCue | enum | No | Default: `countdown-beeps` (3 descending beeps). |

### 2.2 Block Palette UI

- Displayed as a vertical scrollable panel (desktop) or bottom drawer (mobile).
- Each block type shown as a colour-coded chip with icon and label.
- Drag from palette to canvas to instantiate a new block.
- Tapping a placed block opens its attribute editor.
- Palette is always accessible regardless of canvas scroll position.

---

## 3. Container Blocks

Container blocks group one or more foundation blocks (and/or other containers) into a repeatable unit. They are the mechanism for expressing round-based protocols without manually duplicating blocks.

### 3.1 Repeat Container

| Attribute | Type | Required | Description |
|---|---|---|---|
| name | string | Yes | Label for the container (e.g. "Main Circuit", "Finisher"). |
| repetitions | integer | Yes | Number of times the contained sequence repeats. Min: 2. Max: 99. |
| restBetweenReps | Rest block config | No | A full Rest block (with duration, color, and audioStartCue) automatically injected between repetitions. Not injected after the final repetition unless `restAfterLastRep` is true. |
| restAfterLastRep | boolean | No | Default: `false`. If true, `restBetweenReps` is also injected after the final repetition. |
| prepareBeforeEachRep | boolean | No | Default: `false`. If true, a Prepare block fires before each repetition (uses the container-level prepare config). |
| prepareConfig | Prepare block config | No | Duration and audio for the per-rep prepare. Only used when `prepareBeforeEachRep` is true. |
| color | hex color | No | Container border/header color. Defaults to `#F0C93A`. |

### 3.2 Recursive Nesting

A Repeat Container may contain other Repeat Containers. Nesting is **hard-capped at 4 levels**. Attempting to drag a container beyond depth 4 is blocked by the UI with an inline message: "Maximum nesting depth reached."

Example of a valid 3-level structure:

```
Timer root
└── Repeat Container: "Full Workout" (3 reps)          [depth 1]
    ├── Repeat Container: "Tabata Block" (8 reps)       [depth 2]
    │   ├── Work block: 20s
    │   └── Rest block: 10s
    └── Repeat Container: "Strength Block" (4 reps)     [depth 3]
        ├── Work block: 40s
        └── Rest block: 20s
```

> **UI requirement:** Nested containers must render with visual indentation and colour-coded borders that clearly communicate their depth level. Labels must remain readable at all nesting depths.

### 3.3 Container Behaviour at Runtime

- The runtime engine flattens the nested definition into a linear execution queue before the timer starts.
- `restBetweenReps` is injected dynamically during flattening — not stored as duplicate blocks in the definition.
- `prepareBeforeEachRep` blocks are injected before each repetition during flattening.
- Each active container is tracked independently during execution.
- The run screen displays "Round X of Y" for every active container, stacked if multiple containers are active simultaneously.

---

## 4. Timer Metadata & Data Model

### 4.1 Timer Object

| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Generated on creation. |
| name | string | Yes | User-defined timer name. Max 80 characters. |
| description | string | No | Optional notes or protocol description. |
| tags | string[] | No | User-assigned tags (e.g. "HIIT", "strength", "mobility"). Free-entry. |
| countdownBeforeStart | integer (s) | No | Global Prepare countdown before the first block. Options: 0, 3, 5, 10. Default: 5. |
| completionSound | enum | No | Tone at timer end. Options: `completion-horn`, `none`. Default: `completion-horn`. |
| isBundled | boolean | Yes | `true` = shipped with the app. `false` = created by the user. |
| bundleVersion | integer | No | Present only when `isBundled = true`. Identifies the version of the bundled definition that was seeded. Incremented in the app bundle when a bundled timer is updated. Used for future restore-to-default logic. |
| createdAt | ISO 8601 | Yes | Timestamp of creation. |
| updatedAt | ISO 8601 | Yes | Timestamp of last edit. |
| version | integer | Yes | Increments on each save. Starts at 1. |
| totalDuration | integer (s) | Computed | Derived from the flattened block sequence. Not stored. |
| sequence | Block[] | Yes | Ordered array of foundation blocks and/or Repeat Containers. |

> **Note on `isBundled`:** Bundled timers ship as static JSON files included in the app bundle. On first launch, they are written to IndexedDB. The user can edit or delete them — they are treated as regular timers once installed. There is no privileged "admin" state.

### 4.2 JSON Data Model Example

```json
{
  "id": "uuid-001",
  "name": "Classic Tabata",
  "tags": ["HIIT", "cardio"],
  "countdownBeforeStart": 5,
  "completionSound": "completion-horn",
  "isBundled": true,
  "bundleVersion": 1,
  "createdAt": "2026-05-01T00:00:00Z",
  "updatedAt": "2026-05-01T00:00:00Z",
  "version": 1,
  "sequence": [
    {
      "type": "warmup",
      "duration": 120,
      "color": "#5BA85A",
      "label": "Warm Up"
    },
    {
      "type": "repeat",
      "name": "Tabata Rounds",
      "repetitions": 8,
      "color": "#F0C93A",
      "prepareBeforeEachRep": false,
      "restBetweenReps": null,
      "sequence": [
        { "type": "work", "duration": 20, "color": "#D4A017", "label": "WORK" },
        { "type": "rest", "duration": 10, "color": "#333333", "label": "REST" }
      ]
    },
    {
      "type": "cooldown",
      "duration": 60,
      "color": "#7B68EE",
      "label": "Cool Down"
    }
  ]
}
```

### 4.3 Persistence

- **Storage:** IndexedDB via Dexie.js. Single local database, no backend.
- **Scope:** Local to the device and browser. No cloud, no sync, no server.
- **No export, no import, no sharing in v1.0.**

### 4.4 Bundled Timer Authoring Pattern

Bundled timers are authored using the app itself — the builder is the authoring tool for its own default content. This guarantees schema consistency: the exported JSON is produced by the same serialiser used internally, so the bundle can never drift out of sync with the data model.

**Authoring workflow:**

1. Build a timer in the app using the standard builder UI.
2. Trigger a developer export (available in `import.meta.env.DEV` mode only — not visible in production builds).
3. The app serialises the timer to canonical JSON using the standard timer schema.
4. Save the file to `/src/timers-bundle/<timer-name>.json` in the project repository.
5. On next build and deploy, Vite bundles the JSON files as static assets via `import.meta.glob`.
6. On first launch, the app reads all files in the bundle folder and writes them to IndexedDB.

**Updating a bundled timer:**

1. Load the existing bundled timer in the builder.
2. Edit as needed.
3. Re-export, replacing the file in `/src/timers-bundle/`.
4. Increment `bundleVersion` in the exported JSON.
5. Redeploy.

**First-launch seeding logic:**

```
if (IndexedDB timerStore is empty) {
  load all JSON from /src/timers-bundle/
  write each to IndexedDB with isBundled = true
}
```

Once seeded, bundled timers are treated as regular user timers — fully editable and deletable. The `isBundled` and `bundleVersion` fields are retained for future restore-to-default functionality (post-v1.0).

**Bundle discovery (Vite):**

```javascript
const bundledTimers = import.meta.glob('/src/timers-bundle/*.json', { eager: true });
```

No manifest file required — Vite resolves all matching files at build time.

---

## 5. Builder UI & Interactions

### 5.1 Layout

Three-panel layout, responsive across mobile and desktop:

| Panel | Desktop | Mobile |
|---|---|---|
| Block Palette | Left sidebar, fixed | Bottom drawer, collapsible |
| Canvas | Centre, scrollable | Full width, scrollable |
| Timer Properties | Right sidebar, fixed | Slide-up sheet on tap |

### 5.2 Canvas Interactions

#### Drag and Drop

- Drag a block chip from the palette onto the canvas to append it to the sequence.
- Drag to a specific gap between existing blocks to insert inline. A drop indicator line shows the target position.
- Drag a Repeat Container from the palette onto the canvas, then drag blocks into the container's drop zone.
- Drag any block or container to reorder it. Each card has a visible drag handle.
- Drag a Repeat Container into another Repeat Container to nest. Hard-cap at 4 levels — the drop target is visually disabled beyond this depth.

#### Block Editing

- Tap/click any block card to open its attribute editor (slide-out panel on desktop, bottom sheet on mobile).
- Colour picker includes brand palette presets and a custom hex input.
- Duration input: numeric field in seconds with +/− stepper. Also accepts `mm:ss` format.
- All edits apply live — canvas and summary bar update instantly.

#### Canvas Controls

- **Undo / Redo** — `Ctrl+Z` / `Ctrl+Y` on desktop; swipe gesture or on-screen buttons on mobile.
- **Duplicate** — copies a block or container and its full contents.
- **Delete** — removes a block or container. If the container has children, a confirmation dialog appears.
- **Clear all** — removes all blocks from the canvas. Requires confirmation.
- **Timeline minimap** — horizontal strip above the canvas showing block proportions and total duration. Tapping a segment scrolls the canvas to that block.

### 5.3 Timer Summary Bar

Persistent bar at the top or bottom of the builder showing:

- Total timer duration (live-computed, updates within 100ms of any change).
- Total block count.
- **Run** button — launches the execution screen. Disabled if the timer is invalid.
- **Save** button — commits the timer to IndexedDB. Disabled if the timer has no name or no blocks.

### 5.4 Validation Rules

| Condition | Behaviour |
|---|---|
| No blocks on canvas | Run and Save disabled. Message: "Add at least one block to run your timer." |
| Repeat Container is empty | Warning badge on container card. Save allowed; Run blocked. |
| Nesting depth at cap (4) | Drop target disabled. Inline message: "Maximum nesting depth reached." |
| Block duration is 0 | Inline field error on the block card. Run blocked. |
| Timer name is empty | Save blocked. Inline prompt: "Give your timer a name." |

---

## 6. Runtime Execution Engine

### 6.1 Flattening Algorithm

Before execution, the timer definition is transformed into a flat, ordered execution queue:

1. Insert the global Prepare block if `countdownBeforeStart > 0`.
2. Walk the `sequence` array recursively.
3. For each Repeat Container, expand its `sequence` by `repetitions` times, injecting `restBetweenReps` between reps (not after the last unless `restAfterLastRep = true`), and injecting `prepareConfig` before each rep if `prepareBeforeEachRep = true`.
4. Foundation blocks are appended to the queue as-is.
5. The result is a flat `Block[]` with no nesting. Container membership metadata is preserved on each block for "Round X of Y" tracking.

### 6.2 Runtime State Model

| Field | Type | Description |
|---|---|---|
| status | enum | `idle` \| `preparing` \| `running` \| `paused` \| `completed` |
| executionQueue | Block[] | Flattened ordered array generated before run starts. |
| currentIndex | integer | Current position in `executionQueue`. |
| timeRemainingInBlock | integer (ms) | Countdown for the active block. Updated every 100ms. |
| totalElapsed | integer (ms) | Total time elapsed since timer start. |
| totalRemaining | integer (ms) | Derived from remaining blocks in queue. |
| containerProgress | map | `{ containerId: { current: n, total: m } }` — drives "Round X of Y" display. |
| isPreparing | boolean | `true` during any Prepare block. |

### 6.3 Run Screen Layout

- Full-screen, distraction-free. Dark background.
- **Centre:** Block label (e.g. "WORK") in large type (Barlow Condensed). Time remaining in `mm:ss`.
- **Background accent:** Block color fills a strip or the full background at reduced opacity.
- **Below label:** "Round X of Y" for each active Repeat Container. Stacked if multiple containers are active.
- **Progress bar:** Full-width bar showing percentage of total timer elapsed.
- **Next block chip:** Small preview of the next block's label and duration.
- **Controls:** Pause/Resume | Skip | Restart | Exit.
- **Screen wake lock:** Active via Web Lock API while status is `running` or `paused`.

### 6.4 Audio Cue System

All audio is generated programmatically via the Web Audio API. No audio files. No external dependencies.

| Cue | Trigger | Sound |
|---|---|---|
| `countdown-beeps` | Last 3 seconds of any block | 3 descending short beeps |
| `block-start` | First frame of a new Work, Transition, Warmup, or Cooldown block | Short upbeat tone |
| `block-end` | Last frame of any block | Single neutral tone |
| `rest-chime` | First frame of a Rest block | Softer, lower tone |
| `completion-horn` | Timer completed | Longer celebratory tone sequence |

- Global volume control and mute toggle available in Settings.
- Per-block audio cues are overridable in the block attribute editor.
- Audio context is initialised on first user gesture (browser autoplay policy compliance).

### 6.5 State Machine

| From | Event | To |
|---|---|---|
| `idle` | User taps Run | `preparing` |
| `preparing` | Prepare countdown ends | `running` |
| `running` | Block expires, more blocks remain | `running` (next block) |
| `running` | Block expires, no blocks remain | `completed` |
| `running` | User taps Pause | `paused` |
| `paused` | User taps Resume | `running` |
| `running` | User taps Skip | `running` (next block) or `completed` |
| `running` / `paused` | User taps Exit | `idle` |
| `completed` | User taps Restart | `preparing` |

### 6.6 Pause & Resume

- Pause freezes `timeRemainingInBlock` and `totalElapsed` at the exact millisecond.
- Screen dims (50% opacity overlay) while paused.
- All audio cues suspended.
- Resume continues from the exact paused position — no time lost or added.
- If the browser tab is backgrounded, the timer continues via Web Worker. Audio may be suppressed by the browser; visual state remains accurate on return.

---

## 7. Timer Management

### 7.1 Timer Library

The Timer Library is the app's home screen. It displays all timers stored in IndexedDB — both bundled and user-created — as a card grid or list.

Each card displays:
- Timer name and description (if set).
- Total duration.
- Block type summary (colour-coded chips representing the block composition).
- Tags.
- Last run date (if the timer has been run).

Library controls:
- **Quick Run** — launches the timer directly without opening the builder.
- **Filter** by tag or duration range.
- **Search** by name.
- **Sort** by: last run, date created, name, duration.

### 7.2 Save

- Auto-save triggers every 30 seconds while the builder is open.
- Explicit save via the Save button validates and commits to IndexedDB.
- On first save, user is prompted for a name if the field is empty.

### 7.3 Edit

- Tap any timer card → Edit to open the builder with that timer loaded.
- All block types, containers, and metadata are fully editable.
- Saving increments the `version` field.

### 7.4 Delete

- Delete available from the timer card context menu.
- Confirmation: "Delete [Timer Name]? This cannot be undone."
- Bundled timers can be deleted — they are treated as regular timers once written to IndexedDB.

### 7.5 Duplicate

- Any timer can be duplicated.
- Duplicate opens in the builder immediately.
- Default name: "[Original Name] (Copy)".

---

## 8. Bundled Starter Timers

### 8.1 Purpose

Bundled timers ship as static JSON files in the app bundle under `/src/timers-bundle/`. They are written to IndexedDB on first launch and treated as regular user timers from that point forward — fully editable and deletable. They exist to provide immediate value on first open and to demonstrate the full range of what the builder can produce.

There is no privileged "template" state, no admin interface, and no mechanism to push timer updates to existing users after install. Bundled timers are a one-time seed per device.

### 8.2 Authoring

Bundled timers are created using the app's own builder — the same experience any user has. A developer-only export option (visible only when `import.meta.env.DEV = true`) serialises a finished timer to canonical JSON and saves it to `/src/timers-bundle/`. This ensures the bundle is always schema-consistent with the running app. See §4.4 for the full authoring workflow.

### 8.3 Starter Timer Set

| Name | Protocol | Duration |
|---|---|---|
| Classic Tabata | Warmup 2min + 8×[20s work / 10s rest] + cooldown 1min | ~6 min |
| EMOM 10 | 10×[work 45s + transition 15s] | 10 min |
| AMRAP 20 | Single 20-minute work countdown | 20 min |
| Boxing Rounds | 5×[3min work / 1min rest] | ~21 min |
| Pyramid Run | Work: 10s→20s→30s→40s→30s→20s→10s with 15s rest between each | ~5 min |
| 5-5-5 Strength | 3 exercises × 5 rounds × [40s work / 20s rest] | ~22 min |
| Morning Mobility | Warmup 3min + 8×[stretch 45s / transition 10s] + cooldown 3min | ~15 min |
| Pomodoro Focus | 4×[25min work / 5min rest] + 20min long rest | ~120 min |

---

## 9. UX Design Requirements

### 9.1 Brand Tokens

| Token | Value | Usage |
|---|---|---|
| Primary Gold | `#D4A017` | Work blocks, CTAs, active states, highlights |
| Secondary Gold | `#F0C93A` | Hover states, repeat container headers, badges |
| Near-Black | `#1A1A1A` | App background, rest blocks, primary text |
| Surface Dark | `#2C2C2C` | Card backgrounds, builder canvas |
| Success Green | `#5BA85A` | Warmup blocks, completion states |
| Calm Blue | `#4A90D9` | Transition blocks, info states |
| Soft Purple | `#7B68EE` | Cooldown blocks |
| Heading font | Barlow Condensed | Run screen labels, block type names, timer titles |
| Body font | DM Sans | Attribute editors, library, descriptions, controls |

### 9.2 Mobile-First Requirements

- Touch targets: minimum 44 × 44px (Apple HIG / WCAG 2.1).
- Drag-and-drop via pointer events API (mouse and touch unified).
- Canvas scrollable when sequence exceeds viewport height.
- Block palette collapses to a bottom drawer on screens narrower than 768px.
- Run screen labels minimum 48pt. High contrast throughout.
- No hover-only interactions — every action must be accessible via tap.

### 9.3 Accessibility

- WCAG 2.1 AA minimum.
- All interactive elements keyboard-navigable.
- Audio cues supplemented by visual pulse/flash on run screen for users with hearing impairment.
- Block type communicated by both colour and icon — colour is never the sole differentiator.

### 9.4 Performance Targets

| Metric | Target |
|---|---|
| PWA shell load (LTE) | < 2 seconds |
| Builder interaction response | < 100ms |
| Timer accuracy | ± 50ms over a 60-minute session |
| Run screen frame rate | 60fps minimum |
| Offline functionality | 100% — no network dependency after install |

---

## 10. Technical Architecture

### 10.1 Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React + Vite | Existing stack |
| Drag & Drop | dnd-kit | Touch-friendly, accessible, supports nested sortable lists |
| State Management | Zustand | Separate stores for builder definition and runtime state |
| Persistence | IndexedDB via Dexie.js | Single local database, no backend |
| Audio | Web Audio API | Programmatic tone generation — no audio files |
| Timer Accuracy | Web Worker + `performance.now()` | Isolated from main thread to prevent UI jank |
| PWA | Vite PWA Plugin (Workbox) | Service worker, offline cache, install prompt |
| Deployment | Vercel Hobby | Existing target |

### 10.2 Key Modules

| Module | Responsibility |
|---|---|
| `timerDefinitionStore` (Zustand) | Manages the timer JSON being built or edited in the builder. |
| `builderCanvas` | Drag-and-drop canvas with recursive nested block rendering. |
| `flattenTimer(definition)` | Pure function. Converts nested definition → flat execution queue. |
| `timerRuntime` (Web Worker) | Tick loop at 100ms intervals. Owns the runtime state machine. Fires audio trigger events. |
| `audioEngine` | Generates and plays tones via Web Audio API. Responds to events from `timerRuntime`. |
| `timerRepository` (Dexie.js) | CRUD interface for timer definitions in IndexedDB. |
| `bundleSeeder` | Reads all JSON from `/src/timers-bundle/` via `import.meta.glob`. Writes to IndexedDB on first launch if the store is empty. |
| `devExport` (DEV only) | Serialises the current timer definition to JSON and triggers a file download. Used to author bundled timers. Not included in production builds. |

### 10.3 Data Flow

```
Builder UI
  → timerDefinitionStore (Zustand)
    → timerRepository (Dexie / IndexedDB)

Run button
  → flattenTimer(definition) → executionQueue[]
    → timerRuntime (Web Worker)
      → tick events → Run Screen UI (React)
      → audio trigger events → audioEngine (Web Audio API)
```

### 10.4 PWA Behaviour

- Installable on iOS (Add to Home Screen) and Android (install prompt).
- Service worker caches all app assets on first load.
- Fully functional offline after install.
- No push notifications, no background sync — not needed for a local-only app.

---

## 11. Milestones & Scope

### 11.1 v1.0 Scope (MVP)

- All 5 foundation block types + Prepare system block.
- Repeat Container with recursive nesting, hard-capped at 4 levels.
- Builder canvas: drag-and-drop from palette, reorder, nest, duplicate, delete, undo/redo.
- Block attribute editor with live canvas updates.
- Timer metadata: name, description, tags, countdown before start, completion sound.
- Timer Library: save, edit, duplicate, delete, filter, search, sort.
- Run screen: full state machine, audio cues (Web Audio API), pause/resume, skip, restart, exit.
- Screen wake lock during run.
- 8 bundled starter timers authored via the builder and shipped as static JSON in `/src/timers-bundle/`.
- Timeline minimap in the builder.
- PWA installable via Vercel Hobby.
- Fully offline after first load.

### 11.2 Post-v1.0 Candidates

- Run history and personal records per timer.
- Custom audio cue recording (user's own voice or sounds).
- Voice cue integration (text-to-speech block labels via Web Speech API).
- Timer analytics: total training time, most-used blocks, streaks.
- Export / import JSON (if user demand emerges).
- iCloud / Google Drive backup (if cross-device demand emerges).

### 11.3 Permanently Out of Scope

- User accounts, authentication, or any server-side user data.
- Cloud sync or cross-device timer library.
- Timer sharing between users.
- Role-based features (coach/trainee, admin/client).
- Social or community features.

---

## 12. Acceptance Criteria

### 12.1 Builder

1. User can drag any foundation block from the palette onto the canvas. It appears as a colour-coded card.
2. User can drag a block to a new position. A drop indicator shows the insertion point.
3. User can drag a Repeat Container onto the canvas, then drag blocks into it. Children render indented inside the container card.
4. User can drag a Repeat Container into another. The canvas renders the nested structure clearly.
5. Dragging a container to depth 5 is blocked. An inline message appears: "Maximum nesting depth reached."
6. Tapping a block card opens its attribute editor. Changes apply live to the canvas.
7. Total duration in the summary bar updates within 100ms of any block change.
8. Save is blocked if the timer has no name or no blocks.
9. Run is blocked if the timer has an empty Repeat Container or a block with duration 0.
10. Undo reverts the last canvas action. Redo re-applies it.

### 12.2 Runtime

1. Tapping Run flattens the timer, shows the Prepare countdown, then starts the first block.
2. The flattened execution queue correctly expands nested containers, injecting `restBetweenReps` between reps but not after the last rep (unless `restAfterLastRep = true`).
3. Timer countdown is accurate to ± 50ms over a 60-minute session.
4. Audio cues fire at the correct trigger points and respect the global volume/mute setting.
5. Pause freezes the countdown exactly. Resume continues from the same millisecond.
6. Skip advances to the next block. Skipping the last block ends the timer.
7. Screen does not sleep while status is `running` or `paused`.
8. "Round X of Y" correctly reflects repetition progress for every active container.
9. The completion tone plays when the last block expires.

### 12.3 Timer Management

1. All timers in IndexedDB appear in the Timer Library on app load.
2. Bundled timers are present in the library on first launch without any user action.
3. Bundled timers written to IndexedDB carry `isBundled = true` and a `bundleVersion` integer.
4. On subsequent launches where IndexedDB already has timers, the seeder does not re-write bundled timers.
5. Edit opens the builder with the correct timer definition loaded.
6. Saving an edited timer increments its `version` and updates `updatedAt`.
7. Delete removes the timer after confirmation. It does not reappear on refresh.
8. Duplicate creates a fully independent copy. Editing the copy does not affect the original.
9. Filter, search, and sort all produce correct results against the IndexedDB store.
10. The developer export option is visible in DEV mode and produces valid canonical JSON. It is absent in production builds.

### 12.4 PWA & Offline

1. App is installable on iOS and Android.
2. After initial install, the app loads fully with no network connection.
3. Timers can be created, edited, run, and deleted while offline.
4. No network request is made during normal app operation after first load.
