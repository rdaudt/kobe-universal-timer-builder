export type BlockType = 'work' | 'rest' | 'transition' | 'warmup' | 'cooldown' | 'prepare';

export interface FoundationBlock {
  id: string;
  type: BlockType;
  name: string;
  duration: number;
  color: string;
  label: string;
  notes?: string;
  audioStartCue?: 'block-start' | 'rest-chime' | 'countdown-beeps' | 'none';
  audioEndCue?: 'block-end' | 'none';
  autoAdvance?: boolean;
}

export interface RepeatBlock {
  id: string;
  type: 'repeat';
  name: string;
  repetitions: number;
  color: string;
  sequence: TimerNode[];
  restBetweenReps: FoundationBlock | null;
  restAfterLastRep: boolean;
  prepareBeforeEachRep: boolean;
  prepareConfig?: { duration: number };
}

export type TimerNode = FoundationBlock | RepeatBlock;

export interface TimerDefinition {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  countdownBeforeStart: number;
  completionSound?: 'completion-horn' | 'none';
  isBundled: boolean;
  bundleVersion?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  sequence: TimerNode[];
  lastRun?: string;
}

export interface FlatBlock extends FoundationBlock {
  _ctx: Array<{ id: string; name: string; cur: number; total: number }>;
}

export type RuntimeStatus = 'idle' | 'preparing' | 'running' | 'paused' | 'completed';

export interface RuntimeState {
  status: RuntimeStatus;
  executionQueue: FlatBlock[];
  currentIndex: number;
  timeRemainingInBlock: number;
  totalElapsed: number;
}

export type Route = 'onboarding' | 'library' | 'builder' | 'run' | 'complete';
