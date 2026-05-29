import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './Icon';
import { flattenTimer, totalDuration, fmt, fmtLoose, BLOCK_DEFAULTS } from '../lib/helpers';
import { initAudio, playBlockStart, playBlockEnd, playRestChime, playCountdownBeep, playCompletion } from '../lib/audio';
import type { TimerDefinition, FlatBlock } from '../types';
import TimerWorker from '../workers/timerWorker?worker';

interface RunProps {
  timer: TimerDefinition;
  layout?: 'ring' | 'centered' | 'fullbleed';
  onExit: () => void;
  onComplete: () => void;
}

export function Run({ timer, layout = 'ring', onExit, onComplete }: RunProps) {
  const queue = useMemo(() => flattenTimer(timer), [timer]);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(queue[0]?.duration ?? 0);
  const [paused, setPaused] = useState(false);
  const totalDur = useMemo(() => queue.reduce((s, b) => s + b.duration, 0), [queue]);
  const [elapsed, setElapsed] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const jumpTargetRef = useRef<number | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // Screen wake lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((wl) => { wakeLockRef.current = wl; }).catch(() => {});
    }
    return () => { wakeLockRef.current?.release().catch(() => {}); };
  }, []);

  // Init audio on first user interaction
  useEffect(() => { initAudio(); }, []);

  // Timer worker
  useEffect(() => {
    const worker = new TimerWorker();
    workerRef.current = worker;

    let localIdx = 0;
    let localRemaining = queue[0]?.duration ?? 0;
    let blockStart = 0;

    worker.postMessage({ type: 'start' });

    // Play start cue for first block
    const firstBlock = queue[0];
    if (firstBlock) {
      if (firstBlock.type === 'rest') playRestChime();
      else playBlockStart();
    }

    worker.onmessage = (e: MessageEvent) => {
      const { elapsed: workerElapsed } = e.data as { elapsed: number };

      if (jumpTargetRef.current !== null) {
        const jt = jumpTargetRef.current;
        jumpTargetRef.current = null;
        if (jt > localIdx && jt < queue.length) {
          localIdx = jt;
          blockStart = workerElapsed;
          setIdx(localIdx);
          setRemaining(queue[localIdx].duration);
          const jb = queue[localIdx];
          if (jb?.type === 'rest') playRestChime(); else playBlockStart();
          return;
        }
      }

      const nowElapsed = Math.round(workerElapsed / 1000);
      setElapsed(nowElapsed);

      const blockElapsed = (workerElapsed - blockStart) / 1000;
      const blockDur = queue[localIdx]?.duration ?? 0;
      const rem = Math.max(0, blockDur - blockElapsed);

      setRemaining(rem);

      // Countdown beeps in last 3 seconds
      const remRound = Math.ceil(rem);
      if (remRound <= 3 && remRound > 0) {
        playCountdownBeep(3 - remRound);
      }

      if (rem <= 0) {
        // Advance
        playBlockEnd();
        if (localIdx + 1 >= queue.length) {
          worker.postMessage({ type: 'stop' });
          if ((timer.completionSound ?? 'completion-horn') !== 'none') playCompletion();
          setTimeout(() => onComplete(), 600);
          return;
        }
        localIdx++;
        blockStart = workerElapsed;
        const nextBlock = queue[localIdx];
        localRemaining = nextBlock?.duration ?? 0;
        setIdx(localIdx);
        setRemaining(localRemaining);

        // Audio for new block
        if (nextBlock?.type === 'rest') playRestChime();
        else playBlockStart();
      }
    };

    return () => {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paused) workerRef.current?.postMessage({ type: 'pause' });
    else workerRef.current?.postMessage({ type: 'resume' });
  }, [paused]);

  const current = queue[idx] ?? queue[queue.length - 1];
  const next = queue[idx + 1];
  const blockProgress = current ? Math.max(0, Math.min(1, 1 - (remaining / current.duration))) : 0;
  const overallProgress = elapsed / totalDur;

  const skip = () => {
    if (idx + 1 >= queue.length) { onComplete(); return; }
    setIdx(idx + 1);
    setRemaining(queue[idx + 1].duration);
  };

  const jumpTo = (targetIdx: number) => {
    if (targetIdx <= idx || targetIdx >= queue.length) return;
    jumpTargetRef.current = targetIdx;
    setIdx(targetIdx);
    setRemaining(queue[targetIdx].duration);
  };

  const bgColor = current?.color ?? '#D4A017';
  const ink = current?.type === 'rest' || current?.type === 'transition' ? '#F4EFE2' : (BLOCK_DEFAULTS[current?.type ?? 'work']?.ink ?? '#0F0F11');
  const isPrep = current?.type === 'prepare';

  const layoutProps = { current, next, remaining, blockProgress, overallProgress, idx, totalQ: queue.length, ink, bgColor, isPrep, compact: showMap };

  return (
    <div
      className="app"
      style={{
        background: layout === 'fullbleed' ? bgColor : '#0E0D10',
        transition: 'background .4s ease',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', left: 16, right: 16, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onExit} className="btn btn--icon" style={{ width: 40, height: 40, background: layout === 'fullbleed' ? 'rgba(0,0,0,0.18)' : 'var(--surface)', color: ink }}>
          <Icon name="x" size={18} color={layout === 'fullbleed' ? ink : 'var(--ink)'} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: layout === 'fullbleed' ? 'rgba(0,0,0,0.18)' : 'var(--surface)', color: layout === 'fullbleed' ? ink : 'var(--ink-2)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: paused ? '#E04060' : '#5BA85A' }} className={paused ? '' : 'pulse'} />
          {paused ? 'Paused' : timer.name}
        </div>
        <button
          onClick={() => setShowMap((m) => !m)}
          className="btn btn--icon"
          style={{ width: 40, height: 40, background: showMap ? 'var(--gold)' : (layout === 'fullbleed' ? 'rgba(0,0,0,0.18)' : 'var(--surface)') }}
        >
          <Icon name="map" size={16} color={showMap ? 'var(--gold-ink)' : (layout === 'fullbleed' ? ink : 'var(--ink)')} />
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 80px) 0 0', gap: showMap ? 4 : 0, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          {layout === 'fullbleed' && <RunFullbleed {...layoutProps} />}
          {layout === 'centered' && <RunCentered {...layoutProps} />}
          {layout === 'ring' && <RunRing {...layoutProps} />}
        </div>
        {showMap && (
          <RunTimeline timer={timer} current={current} elapsed={elapsed} ink={layout === 'fullbleed' ? ink : 'var(--ink)'} isFullbleed={layout === 'fullbleed'} totalDur={totalDur} queue={queue} currentIdx={idx} onJumpTo={jumpTo} />
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: `16px 24px calc(36px + env(safe-area-inset-bottom, 0px))`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 5, flexShrink: 0 }}>
        <button
          onClick={() => setRemaining(queue[idx].duration)}
          className="btn btn--icon"
          style={{ width: 56, height: 56, background: layout === 'fullbleed' ? 'rgba(0,0,0,0.18)' : 'var(--surface-2)' }}
        >
          <Icon name="back" size={20} color={layout === 'fullbleed' ? ink : 'var(--ink)'} />
        </button>
        <button
          onClick={() => setPaused((p) => !p)}
          className="btn glow"
          style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--gold)', color: 'var(--gold-ink)', boxShadow: '0 10px 30px var(--gold-glow)' }}
        >
          <Icon name={paused ? 'play' : 'pause'} size={32} color="var(--gold-ink)" />
        </button>
        <button
          onClick={skip}
          className="btn btn--icon"
          style={{ width: 56, height: 56, background: layout === 'fullbleed' ? 'rgba(0,0,0,0.18)' : 'var(--surface-2)' }}
        >
          <Icon name="skip" size={20} color={layout === 'fullbleed' ? ink : 'var(--ink)'} />
        </button>
      </div>

      {paused && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2, pointerEvents: 'none' }} />
      )}
    </div>
  );
}

// ─── Ring layout ─────────────────────────────────────────────────────────────

interface LayoutProps {
  current: FlatBlock | undefined;
  next: FlatBlock | undefined;
  remaining: number;
  blockProgress: number;
  overallProgress: number;
  idx: number;
  totalQ: number;
  ink: string;
  bgColor: string;
  isPrep: boolean;
  compact: boolean;
}

function RunRing({ current, next, remaining, blockProgress, bgColor, isPrep, compact }: LayoutProps) {
  const ringSize = compact ? 220 : 300;
  const r = compact ? 95 : 130;
  const c = 2 * Math.PI * r;
  const stroke = compact ? 11 : 14;
  return (
    <div style={{ padding: compact ? '0 16px 0 20px' : '0 24px', textAlign: 'center', color: '#F4EFE2' }}>
      <div className="t-tag" style={{ color: bgColor, marginBottom: compact ? 8 : 12, fontSize: 12 }}>
        {(current?.label ?? current?.name ?? '').toUpperCase()}
      </div>
      <div className="ring-wrap" style={{ width: ringSize, height: ringSize }}>
        <svg viewBox={`0 0 ${ringSize} ${ringSize}`}>
          <circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
          <circle
            cx={ringSize / 2} cy={ringSize / 2} r={r}
            stroke={bgColor} strokeWidth={stroke} fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - blockProgress)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke .4s ease', filter: `drop-shadow(0 0 14px ${bgColor})` }}
          />
        </svg>
        <div className="center">
          <div className="big" style={{ color: '#F4EFE2', fontSize: compact ? 62 : 86 }}>{fmt(remaining)}</div>
          <div style={{ marginTop: 4, color: 'var(--ink-2)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', maxWidth: compact ? 150 : 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isPrep ? 'Starting in…' : current?.name}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        {(current?._ctx ?? []).map((c, i) => (
          <div key={i} className="pill pill--gold" style={{ fontSize: 11 }}>
            {c.name} · {c.cur} of {c.total}
          </div>
        ))}
      </div>

      {next && !compact && (
        <div style={{ marginTop: 18, padding: '10px 14px', background: 'var(--surface)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, width: 'fit-content', margin: '18px auto 0' }}>
          <div className="t-tag" style={{ color: 'var(--ink-3)', fontSize: 10 }}>Up next</div>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: next.color }} />
          <div style={{ fontWeight: 600, fontSize: 13 }}>{next.name}</div>
          <div className="t-mono" style={{ color: 'var(--ink-2)', fontSize: 12 }}>{fmt(next.duration)}</div>
        </div>
      )}
    </div>
  );
}

function RunCentered({ current, remaining, bgColor, isPrep: _isPrep, compact }: LayoutProps) {
  return (
    <div style={{ padding: compact ? '0 16px 0 20px' : '0 24px', textAlign: 'center', color: '#F4EFE2' }}>
      <div className="t-tag" style={{ color: bgColor, fontSize: 13, marginBottom: 12 }}>
        {(current?.label ?? '').toUpperCase()}
      </div>
      <div className="t-num" style={{ fontSize: compact ? 124 : 180, lineHeight: 1, color: '#F4EFE2', textShadow: `0 0 60px ${bgColor}88` }}>
        {fmt(remaining)}
      </div>
      <div className="t-display" style={{ fontSize: compact ? 26 : 32, marginTop: 4, color: bgColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {current?.name}
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        {(current?._ctx ?? []).map((c, i) => (
          <div key={i} className="pill pill--gold" style={{ fontSize: 11 }}>
            {c.name} · {c.cur} of {c.total}
          </div>
        ))}
      </div>
    </div>
  );
}

function RunFullbleed({ current, remaining, ink, isPrep: _isPrep, compact }: LayoutProps) {
  return (
    <div className="pulse" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: ink, padding: compact ? '0 12px 0 20px' : '0 24px', textAlign: 'center' }}>
      <div className="t-tag" style={{ opacity: 0.7, fontSize: 13 }}>
        {(current?.label ?? '').toUpperCase()}
      </div>
      <div className="t-num" style={{ fontSize: compact ? 150 : 220, lineHeight: 1, marginTop: 4, letterSpacing: '-0.04em' }}>
        {fmt(remaining)}
      </div>
      <div className="t-display" style={{ fontSize: compact ? 22 : 28, opacity: 0.85, marginTop: -4, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {current?.name}
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        {(current?._ctx ?? []).map((c, i) => (
          <div key={i} style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.18)', color: ink, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {c.name} · {c.cur} of {c.total}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Run timeline (mission map) ───────────────────────────────────────────────

import type { TimerNode } from '../types';

function RunTimeline({ timer, current, elapsed, ink, isFullbleed, totalDur, queue, currentIdx, onJumpTo }: { timer: TimerDefinition; current: FlatBlock | undefined; elapsed: number; ink: string; isFullbleed: boolean; totalDur: number; queue: FlatBlock[]; currentIdx: number; onJumpTo: (i: number) => void }) {
  const ctxMap: Record<string, { cur: number; total: number }> = {};
  (current?._ctx ?? []).forEach((c) => { ctxMap[c.id] = c; });
  const currentLeafId = current?.id;

  const renderSeq = (seq: TimerNode[], depth = 0): React.ReactNode => {
    return seq.map((b) => {
      if (b.type === 'repeat') {
        const active = ctxMap[b.id];
        return (
          <RepeatGroup key={b.id} block={b} active={active} ink={ink} isFullbleed={isFullbleed}>
            {renderSeq(b.sequence, depth + 1)}
          </RepeatGroup>
        );
      }
      const isCurrent = currentLeafId === b.id;
      return <LeafBar key={b.id} block={b} isCurrent={isCurrent} totalDur={totalDur} ink={ink} isFullbleed={isFullbleed} queue={queue} currentIdx={currentIdx} onJumpTo={onJumpTo} />;
    });
  };

  const bg = isFullbleed ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.025)';
  const border = isFullbleed ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)';

  return (
    <div style={{ width: 84, flexShrink: 0, height: '100%', padding: '4px 10px 4px 8px', borderLeft: `1px solid ${border}`, background: bg, backdropFilter: isFullbleed ? 'blur(6px)' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ fontSize: 9, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', color: isFullbleed ? ink : 'var(--ink-3)', opacity: isFullbleed ? 0.65 : 1, textAlign: 'center', paddingBottom: 8, flexShrink: 0, borderBottom: `1px solid ${border}` }}>Map</div>
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {renderSeq(timer.sequence)}
      </div>
      <div style={{ flexShrink: 0, paddingTop: 8, marginTop: 4, borderTop: `1px solid ${border}`, fontSize: 10, fontFamily: 'var(--f-mono)', fontVariantNumeric: 'tabular-nums', color: isFullbleed ? ink : 'var(--ink-2)', opacity: isFullbleed ? 0.7 : 1, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontFamily: 'var(--f-display)', fontWeight: 700, letterSpacing: '-0.01em' }}>
          {fmt(Math.max(0, totalDur - elapsed))}
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2, opacity: 0.7 }}>left</div>
      </div>
    </div>
  );
}

import type { FoundationBlock, RepeatBlock } from '../types';

function LeafBar({ block, isCurrent, totalDur, ink, isFullbleed, queue, currentIdx, onJumpTo }: { block: FoundationBlock; isCurrent: boolean; totalDur: number; ink: string; isFullbleed: boolean; queue: FlatBlock[]; currentIdx: number; onJumpTo: (i: number) => void }) {
  const ratio = block.duration / totalDur;
  const h = Math.max(8, Math.min(40, Math.round(ratio * 360)));
  const isPast = !queue.slice(currentIdx).some((fb) => fb.id === block.id);
  const nextIdx = !isPast && !isCurrent ? queue.findIndex((fb, i) => i > currentIdx && fb.id === block.id) : -1;
  const canJump = nextIdx !== -1;

  const leafRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isCurrent) leafRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isCurrent]);

  return (
    <div
      ref={leafRef}
      title={`${block.name} · ${fmt(block.duration)}`}
      onClick={canJump ? () => onJumpTo(nextIdx) : undefined}
      style={{
        position: 'relative', height: h, borderRadius: 4, background: block.color,
        opacity: isCurrent ? 1 : isPast ? 0.2 : (isFullbleed ? 0.55 : 0.65),
        boxShadow: isCurrent ? `0 0 0 1.5px ${ink}, 0 0 14px ${block.color}cc` : 'inset 0 1px 0 rgba(255,255,255,0.18)',
        transform: isCurrent ? 'scaleX(1.15)' : 'scaleX(1)',
        transformOrigin: 'center',
        transition: 'transform .2s, opacity .2s, box-shadow .2s',
        cursor: canJump ? 'pointer' : 'default',
      }}
    >
      {isCurrent && (
        <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `6px solid ${block.color}`, filter: `drop-shadow(0 0 4px ${block.color})` }} />
      )}
    </div>
  );
}

function RepeatGroup({ block, active, ink, isFullbleed, children }: { block: RepeatBlock; active?: { cur: number; total: number }; ink: string; isFullbleed: boolean; children: React.ReactNode }) {
  const accent = isFullbleed ? 'rgba(0,0,0,0.6)' : 'var(--gold-2)';
  return (
    <div style={{ position: 'relative', paddingLeft: 8, paddingTop: 2, paddingBottom: 4, borderLeft: `1.5px solid ${accent}`, borderTop: `1.5px solid ${accent}`, borderBottom: `1.5px solid ${accent}`, borderRadius: '6px 0 0 6px', marginLeft: 2 }}>
      <div style={{ position: 'absolute', top: -7, right: -2, padding: '1px 5px', borderRadius: 4, background: active ? (isFullbleed ? 'rgba(0,0,0,0.85)' : 'var(--gold)') : (isFullbleed ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.08)'), color: active ? (isFullbleed ? ink : 'var(--gold-ink)') : (isFullbleed ? ink : 'var(--ink-2)'), fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', fontFamily: 'var(--f-display)', boxShadow: active ? `0 0 8px ${isFullbleed ? 'rgba(0,0,0,0.4)' : 'var(--gold-glow)'}` : 'none' }}>
        {active ? `${active.cur} of ${active.total}` : `×${block.repetitions}`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

// ─── Completion ───────────────────────────────────────────────────────────────

import { countBlocks } from '../lib/helpers';

interface CompletionProps {
  timer: TimerDefinition;
  onRestart: () => void;
  onExit: () => void;
}

export function Completion({ timer, onRestart, onExit }: CompletionProps) {
  const dur = totalDuration(timer.sequence);
  const blocks = countBlocks(timer.sequence);
  return (
    <div className="app" style={{ background: 'radial-gradient(800px 500px at 50% 30%, var(--gold-glow), transparent 70%), var(--bg)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const dx = Math.cos(angle) * (140 + Math.random() * 120);
          const dy = Math.sin(angle) * (140 + Math.random() * 120) - 80;
          const colors = ['#D4A017', '#F0C93A', '#5BA85A', '#4A90D9', '#7B68EE'];
          return (
            <div
              key={i}
              style={{
                position: 'absolute', top: '34%', left: '50%',
                width: 8, height: 8, borderRadius: 2,
                background: colors[i % colors.length],
                '--dx': `${dx}px`, '--dy': `${dy}px`,
                animation: `confetti 1.4s ${0.05 * i}s ease-out forwards`,
                opacity: 0,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 108, height: 108, borderRadius: '50%', background: 'linear-gradient(160deg, var(--gold), var(--gold-2))', display: 'grid', placeItems: 'center', boxShadow: '0 12px 36px var(--gold-glow)', animation: 'scale-in .4s cubic-bezier(.2,.9,.3,1.3)' }}>
          <Icon name="check" size={48} color="var(--gold-ink)" stroke={3.5} />
        </div>

        <div className="t-tag" style={{ color: 'var(--gold)', marginTop: 28 }}>Workout Complete</div>
        <h1 className="t-display" style={{ fontSize: 42, margin: '6px 0 12px', lineHeight: 0.95 }}>{timer.name}</h1>
        <div style={{ color: 'var(--ink-2)', fontSize: 14, maxWidth: 280 }}>Solid work. Logged on device.</div>

        <div style={{ marginTop: 28, display: 'flex', gap: 8, width: '100%' }}>
          <Stat label="Total time" value={fmtLoose(dur)} icon="time" />
          <Stat label="Blocks" value={String(blocks)} icon="grid" />
          <Stat label="Done" value="✓" icon="check" accent />
        </div>
      </div>

      <div style={{ padding: `0 24px calc(36px + env(safe-area-inset-bottom, 0px))`, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1, flexShrink: 0 }}>
        <button onClick={onRestart} className="btn btn--gold glow" style={{ width: '100%', height: 54, fontSize: 15 }}>
          <Icon name="repeat" size={16} color="var(--gold-ink)" /> Run Again
        </button>
        <button onClick={onExit} className="btn btn--ghost" style={{ width: '100%', height: 50, fontSize: 14 }}>
          Back to Library
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div style={{ flex: 1, padding: '14px 8px', borderRadius: 16, background: accent ? 'var(--gold-glow)' : 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: '1px solid var(--line)' }}>
      <Icon name={icon} size={14} color={accent ? 'var(--gold)' : 'var(--ink-3)'} />
      <div className="t-num" style={{ fontSize: 22, color: accent ? 'var(--gold-2)' : 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
