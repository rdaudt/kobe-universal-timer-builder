import { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { totalDuration, fmtLoose, compositionStrip } from '../lib/helpers';
import type { TimerDefinition } from '../types';

interface LibraryProps {
  timers: TimerDefinition[];
  onOpen: (t: TimerDefinition) => void;
  onRun: (t: TimerDefinition) => void;
  onNew: () => void;
}

export function Library({ timers, onOpen, onRun, onNew }: LibraryProps) {
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('All');
  const [sort, setSort] = useState<'recent' | 'name' | 'duration'>('recent');

  const allTags = useMemo(() => {
    const s = new Set<string>(['All']);
    timers.forEach((t) => (t.tags ?? []).forEach((x) => s.add(x)));
    return [...s];
  }, [timers]);

  const filtered = useMemo(() => {
    let f = timers.filter((t) =>
      (tag === 'All' || (t.tags ?? []).includes(tag)) &&
      (!search || t.name.toLowerCase().includes(search.toLowerCase()))
    );
    if (sort === 'name') f = [...f].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'duration') f = [...f].sort((a, b) => totalDuration(a.sequence) - totalDuration(b.sequence));
    return f;
  }, [timers, search, tag, sort]);

  const cycleSorts: Record<string, 'recent' | 'name' | 'duration'> = { recent: 'name', name: 'duration', duration: 'recent' };

  return (
    <div className="app" style={{ overflow: 'auto', paddingBottom: 80 }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top, 12px) + 12px) 22px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="t-tag" style={{ color: 'var(--gold)' }}>KOBE · v1.0</div>
          <button className="btn btn--icon" style={{ width: 38, height: 38, background: 'var(--surface)' }}>
            <Icon name="settings" size={18} color="var(--ink-2)" />
          </button>
        </div>
        <h1 className="t-display" style={{ fontSize: 44, lineHeight: 0.9, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          Your Timers
        </h1>
        <div style={{ color: 'var(--ink-2)', fontSize: 14 }}>
          {timers.length} timer{timers.length === 1 ? '' : 's'} · saved on device
        </div>
      </div>

      <div style={{ padding: '20px 22px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', borderRadius: 14, padding: '10px 14px', border: '1px solid var(--line)' }}>
          <Icon name="search" size={16} color="var(--ink-3)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search timers"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)', fontSize: 14, fontFamily: 'var(--f-body)' }}
          />
          <button
            className="btn"
            style={{ background: 'var(--surface-2)', padding: '4px 10px', fontSize: 11, gap: 4, letterSpacing: '0.06em', color: 'var(--ink-2)' }}
            onClick={() => setSort(cycleSorts[sort])}
          >
            <Icon name="list" size={12} />
            {sort.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: '4px 22px 16px', overflowX: 'auto' }}>
        {allTags.map((tg) => (
          <button
            key={tg}
            onClick={() => setTag(tg)}
            className={`pill ${tag === tg ? 'pill--solid' : ''}`}
            style={{ flexShrink: 0, cursor: 'pointer', border: 'none' }}
          >{tg}</button>
        ))}
      </div>

      <div style={{ padding: '4px 22px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map((t) => (
          <CardRow key={t.id} timer={t} onOpen={() => onOpen(t)} onRun={() => onRun(t)} />
        ))}
        <button
          onClick={onNew}
          style={{
            background: 'transparent', border: '1.5px dashed var(--line-2)', color: 'var(--ink-2)',
            padding: '18px', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={16} color="var(--gold)" />
          New Timer
        </button>
      </div>
    </div>
  );
}

function CompositionStrip({ timer }: { timer: TimerDefinition }) {
  const items = compositionStrip(timer.sequence);
  const total = items.reduce((s, i) => s + i.weight, 0) || 1;
  return (
    <div className="composition">
      {items.map((it, i) => (
        <span key={i} style={{ width: `${(it.weight / total) * 100}%`, background: it.color }} />
      ))}
    </div>
  );
}

function CardRow({ timer, onOpen, onRun }: { timer: TimerDefinition; onOpen: () => void; onRun: () => void }) {
  const dur = totalDuration(timer.sequence);
  return (
    <div className="lib-card" onClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="t-display" style={{ fontSize: 24, margin: '0 0 6px', lineHeight: 0.95, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {timer.name}
          </h3>
          <div style={{ color: 'var(--ink-2)', fontSize: 13, marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {timer.description}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="pill pill--gold">
              <Icon name="time" size={11} />
              {fmtLoose(dur)}
            </span>
            {(timer.tags ?? []).slice(0, 2).map((tg) => (
              <span key={tg} className="pill">{tg}</span>
            ))}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRun(); }}
          style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: 'var(--gold)', color: 'var(--gold-ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 6px 14px var(--gold-glow)' }}
        >
          <Icon name="play" size={20} color="var(--gold-ink)" />
        </button>
      </div>
      <CompositionStrip timer={timer} />
      {timer.lastRun && (
        <div style={{ marginTop: 10, color: 'var(--ink-3)', fontSize: 11, letterSpacing: '0.05em' }}>
          Last run · {timer.lastRun}
        </div>
      )}
    </div>
  );
}
