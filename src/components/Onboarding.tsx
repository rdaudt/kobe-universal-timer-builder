import { useState } from 'react';
import { Icon } from './Icon';
import { Block } from './Block';
import { makeBlock, makeRepeat } from '../lib/helpers';

interface OnboardingProps {
  onDone: () => void;
}

export function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      kicker: 'Welcome',
      title: 'Build any timer\nlike LEGO bricks.',
      body: "Drag blocks. Snap them together. Run it. That's it — no menus, no modes.",
      art: <BrickStack />,
    },
    {
      kicker: 'Round it up',
      title: 'Wrap blocks in\nrepeat loops.',
      body: 'Boxing rounds, Tabata, EMOM, pyramid sets — nest as deep as four levels.',
      art: <LoopArt />,
    },
    {
      kicker: 'Run live',
      title: 'A big clock.\nA clear voice.',
      body: 'Distraction-free run screen with audio cues, pause, skip and screen wake-lock.',
      art: <RunArt />,
    },
  ];

  const s = steps[step];

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 12px) + 12px)', right: 20, zIndex: 5 }}>
        <button onClick={onDone} className="btn btn--ghost" style={{ padding: '8px 16px', fontSize: 13, background: 'transparent', color: 'var(--ink-2)' }}>
          Skip
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(600px 400px at 50% 40%, var(--gold-glow), transparent 60%)', minHeight: 360 }}>
        <div key={step} style={{ animation: 'scale-in .35s cubic-bezier(.2,.9,.3,1.1)' }}>
          {s.art}
        </div>
      </div>

      <div style={{ padding: '28px 28px 36px', flexShrink: 0 }}>
        <div className="t-tag" style={{ color: 'var(--gold)', marginBottom: 14 }}>{s.kicker}</div>
        <h1 className="t-display" style={{ fontSize: 40, lineHeight: 0.95, margin: '0 0 16px', whiteSpace: 'pre-line', letterSpacing: '-0.01em' }}>
          {s.title}
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.45, margin: 0 }}>{s.body}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, i) => (
              <div key={i} className={`dot ${i === step ? 'is-active' : ''}`} />
            ))}
          </div>
          <button
            className="btn btn--gold glow"
            style={{ padding: '14px 24px', fontSize: 15 }}
            onClick={() => {
              if (step === steps.length - 1) onDone();
              else setStep(step + 1);
            }}
          >
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
            <Icon name="chev" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BrickStack() {
  const items = [
    { type: 'warmup' as const, name: 'Warm Up', d: 180 },
    { type: 'work' as const,   name: 'Work',    d: 60  },
    { type: 'rest' as const,   name: 'Rest',    d: 30  },
    { type: 'work' as const,   name: 'Work',    d: 60  },
  ];
  return (
    <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((b, i) => (
        <Block key={i} block={makeBlock(b.type, { name: b.name, duration: b.d })} dragHandle={false} mini />
      ))}
    </div>
  );
}

function LoopArt() {
  const repeat = makeRepeat(5, [
    makeBlock('work', { name: 'Round', duration: 180 }),
    makeBlock('rest', { name: 'Corner', duration: 60 }),
  ], { name: '5 Rounds' });
  return (
    <div style={{ width: 240, position: 'relative' }}>
      <div className="repeat" style={{ padding: '24px 14px 24px 32px' }}>
        <div className="bracket" />
        <div className="rep-head">
          <div className="rep-x">× {repeat.repetitions} Rounds</div>
          <Icon name="repeat" size={14} color="var(--gold-2)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Block block={makeBlock('work', { name: 'Round', duration: 180 })} dragHandle={false} mini styleVariant="flat" />
          <Block block={makeBlock('rest', { name: 'Corner', duration: 60 })} dragHandle={false} mini styleVariant="flat" />
        </div>
      </div>
    </div>
  );
}

function RunArt() {
  return (
    <div style={{ width: 240, height: 240, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 32, background: 'linear-gradient(160deg, var(--gold), var(--gold-2))', boxShadow: '0 20px 60px var(--gold-glow), inset 0 1px 0 rgba(255,255,255,0.4)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-ink)' }}>
        <div className="t-tag" style={{ fontSize: 11, opacity: 0.7 }}>Work · Round 3 of 5</div>
        <div className="t-num" style={{ fontSize: 88, lineHeight: 1, marginTop: 6 }}>02:14</div>
        <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
          {[32, 32, 32, 16, 32].map((w, i) => (
            <div key={i} style={{ width: w, height: 6, borderRadius: 3, background: i < 3 ? 'rgba(0,0,0,0.6)' : (i === 3 ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)') }} />
          ))}
        </div>
      </div>
    </div>
  );
}
