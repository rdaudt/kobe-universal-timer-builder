import Dexie, { type Table } from 'dexie';
import type { TimerDefinition } from '../types';
import { uid, makeBlock, makeRepeat } from './helpers';

class KobeDB extends Dexie {
  timers!: Table<TimerDefinition>;

  constructor() {
    super('KobeTimerDB');
    this.version(1).stores({
      timers: 'id, name, isBundled, updatedAt',
    });
  }
}

export const db = new KobeDB();

const BUNDLED_TIMERS: TimerDefinition[] = [
  {
    id: 'boxing-rounds',
    name: 'Boxing Rounds',
    description: '5 rounds of hands-up work with active recovery.',
    tags: ['Boxing', 'Cardio'],
    countdownBeforeStart: 5,
    completionSound: 'completion-horn',
    isBundled: true,
    bundleVersion: 1,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    version: 1,
    lastRun: '2 days ago',
    sequence: [
      makeBlock('warmup', { duration: 180, name: 'Shadow Box' }),
      makeRepeat(5, [
        makeBlock('work', { duration: 180, name: 'Round', label: 'WORK' }),
        makeBlock('rest', { duration: 60, name: 'Corner' }),
      ], { name: 'Bell Rounds' }),
      makeBlock('cooldown', { duration: 120, name: 'Stretch & Shake' }),
    ],
  },
  {
    id: 'classic-tabata',
    name: 'Classic Tabata',
    description: '8 rounds, 20s on / 10s off. Hard.',
    tags: ['HIIT', 'Cardio'],
    countdownBeforeStart: 5,
    completionSound: 'completion-horn',
    isBundled: true,
    bundleVersion: 1,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    version: 1,
    lastRun: 'Yesterday',
    sequence: [
      makeBlock('warmup', { duration: 120 }),
      makeRepeat(8, [
        makeBlock('work', { duration: 20 }),
        makeBlock('rest', { duration: 10 }),
      ], { name: 'Tabata' }),
      makeBlock('cooldown', { duration: 60 }),
    ],
  },
  {
    id: 'emom-10',
    name: 'EMOM 10',
    description: 'Every minute on the minute for 10.',
    tags: ['HIIT', 'Conditioning'],
    countdownBeforeStart: 5,
    completionSound: 'completion-horn',
    isBundled: true,
    bundleVersion: 1,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    version: 1,
    sequence: [
      makeRepeat(10, [
        makeBlock('work', { duration: 45 }),
        makeBlock('transition', { duration: 15 }),
      ], { name: 'EMOM' }),
    ],
  },
  {
    id: 'pyramid-run',
    name: 'Pyramid Run',
    description: 'Climb up, climb down. 10→40→10 seconds.',
    tags: ['Cardio', 'Running'],
    countdownBeforeStart: 3,
    completionSound: 'completion-horn',
    isBundled: true,
    bundleVersion: 1,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    version: 1,
    sequence: [
      makeBlock('warmup', { duration: 90 }),
      makeBlock('work', { duration: 10, name: 'Sprint 1' }),
      makeBlock('rest', { duration: 15 }),
      makeBlock('work', { duration: 20, name: 'Sprint 2' }),
      makeBlock('rest', { duration: 15 }),
      makeBlock('work', { duration: 30, name: 'Sprint 3' }),
      makeBlock('rest', { duration: 15 }),
      makeBlock('work', { duration: 40, name: 'Sprint 4' }),
      makeBlock('rest', { duration: 15 }),
      makeBlock('work', { duration: 30, name: 'Sprint 5' }),
      makeBlock('rest', { duration: 15 }),
      makeBlock('work', { duration: 20, name: 'Sprint 6' }),
      makeBlock('rest', { duration: 15 }),
      makeBlock('work', { duration: 10, name: 'Sprint 7' }),
      makeBlock('cooldown', { duration: 60 }),
    ],
  },
  {
    id: '5-5-5-strength',
    name: '5-5-5 Strength',
    description: '3 exercises × 5 rounds. Heavy.',
    tags: ['Strength'],
    countdownBeforeStart: 10,
    completionSound: 'completion-horn',
    isBundled: true,
    bundleVersion: 1,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    version: 1,
    lastRun: '5 days ago',
    sequence: [
      makeBlock('warmup', { duration: 180 }),
      makeRepeat(3, [
        makeRepeat(5, [
          makeBlock('work', { duration: 40 }),
          makeBlock('rest', { duration: 20 }),
        ], { name: 'Set' }),
        makeBlock('transition', { duration: 60, name: 'Move to Next' }),
      ], { name: 'Exercise' }),
      makeBlock('cooldown', { duration: 120 }),
    ],
  },
  {
    id: 'morning-mobility',
    name: 'Morning Mobility',
    description: 'Wake up the joints. Gentle.',
    tags: ['Mobility', 'Recovery'],
    countdownBeforeStart: 3,
    completionSound: 'completion-horn',
    isBundled: true,
    bundleVersion: 1,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    version: 1,
    sequence: [
      makeBlock('warmup', { duration: 180 }),
      makeRepeat(8, [
        makeBlock('work', { duration: 45, name: 'Stretch', color: '#5BA85A' }),
        makeBlock('transition', { duration: 10 }),
      ], { name: 'Flow' }),
      makeBlock('cooldown', { duration: 180 }),
    ],
  },
  {
    id: 'amrap-20',
    name: 'AMRAP 20',
    description: 'As many rounds as possible in 20 minutes.',
    tags: ['HIIT', 'Conditioning'],
    countdownBeforeStart: 5,
    completionSound: 'completion-horn',
    isBundled: true,
    bundleVersion: 1,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    version: 1,
    sequence: [
      makeBlock('work', { duration: 1200, name: 'AMRAP', label: 'WORK' }),
    ],
  },
  {
    id: 'pomodoro-focus',
    name: 'Pomodoro Focus',
    description: '4 × 25 min work / 5 min rest + 20 min long rest.',
    tags: ['Focus', 'Productivity'],
    countdownBeforeStart: 5,
    completionSound: 'completion-horn',
    isBundled: true,
    bundleVersion: 1,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    version: 1,
    sequence: [
      makeRepeat(4, [
        makeBlock('work', { duration: 1500, name: 'Deep Work', label: 'FOCUS' }),
        makeBlock('rest', { duration: 300, name: 'Short Break' }),
      ], { name: 'Pomodoro' }),
      makeBlock('rest', { duration: 1200, name: 'Long Break' }),
    ],
  },
];

export async function seedBundledTimers(): Promise<void> {
  const count = await db.timers.count();
  if (count === 0) {
    await db.timers.bulkAdd(BUNDLED_TIMERS);
  }
}

export async function getAllTimers(): Promise<TimerDefinition[]> {
  return db.timers.orderBy('updatedAt').reverse().toArray();
}

export async function saveTimer(timer: TimerDefinition): Promise<void> {
  await db.timers.put({ ...timer, updatedAt: new Date().toISOString(), version: (timer.version || 0) + 1 });
}

export async function deleteTimer(id: string): Promise<void> {
  await db.timers.delete(id);
}

export async function duplicateTimer(timer: TimerDefinition): Promise<TimerDefinition> {
  const copy: TimerDefinition = {
    ...JSON.parse(JSON.stringify(timer)),
    id: uid(),
    name: `${timer.name} (Copy)`,
    isBundled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    lastRun: undefined,
  };
  await db.timers.add(copy);
  return copy;
}
