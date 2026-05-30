import { useState } from 'react';
import { Icon } from './Icon';
import { Block } from './Block';
import { makeBlock, fmt, fmtLoose, totalDuration, BLOCK_DEFAULTS } from '../lib/helpers';
import type { TimerNode, FoundationBlock, RepeatBlock } from '../types';

interface BlockEditorProps {
  path: number[];
  block: TimerNode;
  onChange: (mut: (n: TimerNode) => void) => void;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function BlockEditor({ path, block, onChange, onClose, onDelete, onDuplicate }: BlockEditorProps) {
  const isRepeat = block.type === 'repeat';
  const def = BLOCK_DEFAULTS[block.type];
  const COLOR_PRESETS = ['#D4A017', '#F0C93A', '#5BA85A', '#4A90D9', '#7B68EE', '#F76B3F', '#E04060', '#3A3A3F'];

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '88%' }}>
        <div className="sheet-handle" />

        <div style={{ padding: '0 20px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="t-tag" style={{ color: 'var(--ink-3)' }}>
              {isRepeat ? 'Repeat Container' : (def?.label ?? block.type).toUpperCase()} · Depth {path.length}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Icon name="x" size={16} />
            </button>
          </div>

          <input
            value={block.name}
            onChange={(e) => onChange((b) => { b.name = e.target.value; })}
            className="t-display"
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 800,
              color: 'var(--ink)', padding: '4px 0', letterSpacing: '0.01em', textTransform: 'uppercase',
            }}
          />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
          {isRepeat ? (
            <RepeatEditor block={block as RepeatBlock} onChange={onChange} />
          ) : (
            <BlockSetup block={block as FoundationBlock} onChange={onChange} colorPresets={COLOR_PRESETS} />
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '14px 20px 6px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          <button onClick={onDuplicate} className="btn btn--ghost" style={{ flex: 1, padding: '14px 0', fontSize: 13 }}>
            <Icon name="copy" size={15} color="var(--ink-2)" /> Duplicate
          </button>
          <button onClick={onDelete} className="btn" style={{ flex: 1, padding: '14px 0', fontSize: 13, background: 'rgba(224,64,96,0.10)', color: '#E04060' }}>
            <Icon name="trash" size={15} color="#E04060" /> Delete
          </button>
          <button onClick={onClose} className="btn btn--gold" style={{ flex: 1.4, padding: '14px 0', fontSize: 13 }}>
            <Icon name="check" size={15} color="var(--gold-ink)" /> Done
          </button>
        </div>
      </div>
    </>
  );
}

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
    if (!editing) return;
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

function BlockSetup({ block, onChange, colorPresets }: { block: FoundationBlock; onChange: (mut: (n: TimerNode) => void) => void; colorPresets: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 12 }}>
      <Block block={block} dragHandle={false} />

      <Section label="Duration">
        <DurationStepper
          value={block.duration}
          onChange={(v) => onChange((b) => { if (b.type !== 'repeat') b.duration = v; })}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {[10, 20, 30, 45, 60, 90, 120, 180].map((s) => (
            <button
              key={s}
              onClick={() => onChange((b) => { if (b.type !== 'repeat') b.duration = s; })}
              style={{
                padding: '6px 10px', borderRadius: 8, border: 'none',
                background: block.duration === s ? 'var(--gold)' : 'var(--surface-2)',
                color: block.duration === s ? 'var(--gold-ink)' : 'var(--ink-2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--f-mono)',
              }}
            >{s}s</button>
          ))}
        </div>
      </Section>

      <Section label="Accent Color">
        <div style={{ display: 'flex', gap: 8 }}>
          {colorPresets.map((c) => (
            <button
              key={c}
              onClick={() => onChange((b) => { if (b.type !== 'repeat') b.color = c; })}
              style={{
                width: 32, height: 32, borderRadius: 10, border: 'none',
                background: c, cursor: 'pointer', flexShrink: 0,
                outline: block.color === c ? '2px solid var(--ink)' : 'none',
                outlineOffset: 2,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>
      </Section>

      <Section label="Coach Note">
        <textarea
          value={block.notes ?? ''}
          onChange={(e) => onChange((b) => { if (b.type !== 'repeat') b.notes = e.target.value; })}
          placeholder="e.g. Hands up, breathe through the nose"
          rows={2}
          style={{
            width: '100%', background: 'var(--surface-2)', color: 'var(--ink)',
            border: 'none', borderRadius: 12, padding: '10px 12px',
            fontFamily: 'var(--f-body)', fontSize: 13, resize: 'none', outline: 'none',
          }}
        />
      </Section>

      <Section label="Audio Cues">
        <ToggleRow
          icon="sound"
          label="Start tone"
          on={block.audioStartCue !== 'none'}
          onChange={(v) => onChange((b) => { if (b.type !== 'repeat') b.audioStartCue = v ? 'block-start' : 'none'; })}
        />
        <ToggleRow
          icon="bolt"
          label="End tone"
          on={block.audioEndCue !== 'none'}
          onChange={(v) => onChange((b) => { if (b.type !== 'repeat') b.audioEndCue = v ? 'block-end' : 'none'; })}
        />
      </Section>
    </div>
  );
}

function RepeatEditor({ block, onChange }: { block: RepeatBlock; onChange: (mut: (n: TimerNode) => void) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 12 }}>
      <Section label="Repetitions">
        <div className="stepper">
          <button onClick={() => onChange((b) => { if (b.type === 'repeat') b.repetitions = Math.max(2, b.repetitions - 1); })}>
            <Icon name="minus" size={14} color="var(--ink-2)" />
          </button>
          <div className="val">× {block.repetitions}</div>
          <button onClick={() => onChange((b) => { if (b.type === 'repeat') b.repetitions = Math.min(99, b.repetitions + 1); })}>
            <Icon name="plus" size={14} color="var(--ink-2)" />
          </button>
        </div>
      </Section>

      <Section label="Rest Between Reps">
        <ToggleRow
          icon="rest"
          label="Auto-inject rest"
          on={!!block.restBetweenReps}
          onChange={(v) => onChange((b) => {
            if (b.type === 'repeat') b.restBetweenReps = v ? makeBlock('rest', { duration: 30, name: 'Round Rest' }) : null;
          })}
        />
        {block.restBetweenReps && (
          <div className="stepper" style={{ marginTop: 8 }}>
            <button onClick={() => onChange((b) => { if (b.type === 'repeat' && b.restBetweenReps) b.restBetweenReps.duration = Math.max(1, b.restBetweenReps.duration - 5); })}>
              <Icon name="minus" size={14} color="var(--ink-2)" />
            </button>
            <div className="val">{fmt(block.restBetweenReps.duration)}</div>
            <button onClick={() => onChange((b) => { if (b.type === 'repeat' && b.restBetweenReps) b.restBetweenReps.duration += 5; })}>
              <Icon name="plus" size={14} color="var(--ink-2)" />
            </button>
          </div>
        )}
      </Section>

      <Section label="Prepare Each Round">
        <ToggleRow
          icon="time"
          label={'"Get Ready" countdown'}
          on={block.prepareBeforeEachRep}
          onChange={(v) => onChange((b) => { if (b.type === 'repeat') b.prepareBeforeEachRep = v; })}
        />
      </Section>

      <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(240, 201, 58, 0.06)', border: '1px solid rgba(240, 201, 58, 0.18)', fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)' }}>
        <Icon name="sparkle" size={12} color="var(--gold-2)" /> &nbsp;
        Contains <strong style={{ color: 'var(--gold-2)' }}>{block.sequence.length}</strong> blocks ·
        runs for <strong style={{ color: 'var(--gold-2)' }}>{fmtLoose(totalDuration([block]))}</strong> total
      </div>
    </div>
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

function ToggleRow({ icon, label, on, onChange }: { icon: string; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 12, marginBottom: 6 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: on ? 'var(--gold-glow)' : 'var(--surface-3)', display: 'grid', placeItems: 'center' }}>
        <Icon name={icon} size={14} color={on ? 'var(--gold)' : 'var(--ink-3)'} />
      </div>
      <div style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{label}</div>
      <button
        onClick={() => onChange(!on)}
        style={{ width: 46, height: 28, borderRadius: 14, border: 'none', background: on ? 'var(--gold)' : 'var(--surface-3)', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}
      >
        <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  );
}
