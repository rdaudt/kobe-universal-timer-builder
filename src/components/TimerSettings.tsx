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
