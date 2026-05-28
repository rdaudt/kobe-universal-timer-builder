import type { FoundationBlock, RepeatBlock, TimerNode, FlatBlock, TimerDefinition } from '../types';

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export const BLOCK_DEFAULTS: Record<string, { color: string; ink: string; defaultDur: number; defaultName: string; label: string; icon: string }> = {
  work:       { color: '#D4A017', ink: '#1A1408', defaultDur: 180, defaultName: 'Work',        label: 'Work',        icon: 'work'   },
  rest:       { color: '#3A3A3F', ink: '#F4EFE2', defaultDur: 60,  defaultName: 'Rest',        label: 'Rest',        icon: 'rest'   },
  transition: { color: '#4A90D9', ink: '#06121F', defaultDur: 10,  defaultName: 'Switch Sides',label: 'Transition',  icon: 'trans'  },
  warmup:     { color: '#5BA85A', ink: '#06170A', defaultDur: 120, defaultName: 'Warm Up',     label: 'Warm Up',     icon: 'warm'   },
  cooldown:   { color: '#7B68EE', ink: '#0C0822', defaultDur: 120, defaultName: 'Cool Down',   label: 'Cool Down',   icon: 'cool'   },
  prepare:    { color: '#F0C93A', ink: '#1A1408', defaultDur: 5,   defaultName: 'Get Ready',   label: 'Get Ready',   icon: 'time'   },
};

export function makeBlock(type: FoundationBlock['type'], overrides: Partial<FoundationBlock> = {}): FoundationBlock {
  const def = BLOCK_DEFAULTS[type];
  return {
    id: uid(),
    type,
    name: def.defaultName,
    duration: def.defaultDur,
    color: def.color,
    label: def.label.toUpperCase(),
    notes: '',
    ...overrides,
  };
}

export function makeRepeat(reps = 3, sequence: TimerNode[] = [], overrides: Partial<RepeatBlock> = {}): RepeatBlock {
  return {
    id: uid(),
    type: 'repeat',
    name: 'Round',
    repetitions: reps,
    color: '#F0C93A',
    restBetweenReps: null,
    restAfterLastRep: false,
    prepareBeforeEachRep: false,
    sequence,
    ...overrides,
  };
}

export function flattenTimer(timer: TimerDefinition): FlatBlock[] {
  const out: FlatBlock[] = [];
  if (timer.countdownBeforeStart > 0) {
    out.push({
      ...makeBlock('prepare'),
      name: 'Get Ready',
      label: 'GET READY',
      duration: timer.countdownBeforeStart,
      color: '#F0C93A',
      _ctx: [],
    });
  }
  const walk = (seq: TimerNode[], ctx: FlatBlock['_ctx'] = []) => {
    seq.forEach((b) => {
      if (b.type === 'repeat') {
        for (let i = 0; i < b.repetitions; i++) {
          walk(b.sequence, [...ctx, { id: b.id, name: b.name, cur: i + 1, total: b.repetitions }]);
          if (b.restBetweenReps && i < b.repetitions - 1) {
            out.push({ ...b.restBetweenReps, _ctx: [...ctx] });
          }
          if (b.restBetweenReps && i === b.repetitions - 1 && b.restAfterLastRep) {
            out.push({ ...b.restBetweenReps, _ctx: [...ctx] });
          }
        }
      } else {
        out.push({ ...b, _ctx: ctx });
      }
    });
  };
  walk(timer.sequence);
  return out;
}

export function totalDuration(seq: TimerNode[]): number {
  return seq.reduce((sum, b) => {
    if (b.type === 'repeat') {
      const inner = totalDuration(b.sequence);
      const between = b.restBetweenReps ? b.restBetweenReps.duration : 0;
      return sum + inner * b.repetitions + between * (b.repetitions - 1);
    }
    return sum + (b.duration || 0);
  }, 0);
}

export function fmt(sec: number): string {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fmtLoose(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${m} min`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function compositionStrip(seq: TimerNode[]): Array<{ color: string; weight: number }> {
  const out: Array<{ color: string; weight: number }> = [];
  const walk = (s: TimerNode[]) => {
    s.forEach((b) => {
      if (b.type === 'repeat') {
        for (let i = 0; i < b.repetitions; i++) walk(b.sequence);
      } else {
        out.push({ color: b.color, weight: b.duration });
      }
    });
  };
  walk(seq);
  return out;
}

export function countBlocks(seq: TimerNode[]): number {
  let n = 0;
  const walk = (s: TimerNode[]) => s.forEach((b) => {
    if (b.type === 'repeat') walk(b.sequence);
    else n++;
  });
  walk(seq);
  return n;
}

export function shade(hex: string, amt: number): string {
  const c = hex.replace('#', '');
  let r = parseInt(c.slice(0, 2), 16);
  let g = parseInt(c.slice(2, 4), 16);
  let b = parseInt(c.slice(4, 6), 16);
  r = Math.max(0, Math.min(255, r + Math.round(255 * amt)));
  g = Math.max(0, Math.min(255, g + Math.round(255 * amt)));
  b = Math.max(0, Math.min(255, b + Math.round(255 * amt)));
  return `rgb(${r},${g},${b})`;
}

export function nestingDepth(seq: TimerNode[], targetId: string, currentDepth = 0): number {
  for (const b of seq) {
    if (b.id === targetId) return currentDepth;
    if (b.type === 'repeat') {
      const found = nestingDepth(b.sequence, targetId, currentDepth + 1);
      if (found >= 0) return found;
    }
  }
  return -1;
}

export function getBlockInkColor(block: FoundationBlock | RepeatBlock): string {
  if (block.type === 'rest') return '#F4EFE2';
  if (block.type === 'repeat') return '#F4EFE2';
  return BLOCK_DEFAULTS[block.type]?.ink ?? '#fff';
}
