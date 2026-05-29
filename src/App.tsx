import { useState, useEffect, useCallback, useRef } from 'react';
import { Onboarding } from './components/Onboarding';
import { Library } from './components/Library';
import { Builder } from './components/Builder';
import { Run, Completion } from './components/Run';
import { syncBundledTimers, getAllTimers, saveTimer, restoreBundledTimer, deleteTimer } from './lib/db';
import { uid } from './lib/helpers';
import type { TimerDefinition, Route } from './types';

const ONBOARDING_KEY = 'kobe-onboarding-done';

export default function App() {
  const [route, setRoute] = useState<Route>('onboarding');
  const [timers, setTimers] = useState<TimerDefinition[]>([]);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const unsavedNewTimers = useRef<Set<string>>(new Set());

  const activeTimer = timers.find((t) => t.id === activeTimerId) ?? timers[0];

  // Seed and load timers
  useEffect(() => {
    (async () => {
      await syncBundledTimers();
      const all = await getAllTimers();
      setTimers(all);
      setLoading(false);
      // Skip onboarding if already done
      if (localStorage.getItem(ONBOARDING_KEY)) {
        setRoute('library');
      }
    })();
  }, []);

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setRoute('library');
  };

  const handleOpenTimer = (t: TimerDefinition) => {
    setActiveTimerId(t.id);
    setRoute('builder');
  };

  const handleRunTimer = (t: TimerDefinition) => {
    setActiveTimerId(t.id);
    setRoute('run');
  };

  const handleNewTimer = () => {
    const t: TimerDefinition = {
      id: uid(),
      name: 'My Timer',
      description: '',
      tags: [],
      countdownBeforeStart: 5,
      completionSound: 'completion-horn',
      isBundled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      sequence: [],
    };
    unsavedNewTimers.current.add(t.id);
    setTimers((prev) => [t, ...prev]);
    setActiveTimerId(t.id);
    setRoute('builder');
  };

  const handleTimerChange = useCallback(async (next: TimerDefinition) => {
    unsavedNewTimers.current.delete(next.id);
    setTimers((prev) => prev.map((t) => (t.id === next.id ? next : t)));
    await saveTimer(next);
  }, []);

  const handleBack = useCallback(() => {
    if (activeTimerId && unsavedNewTimers.current.has(activeTimerId)) {
      unsavedNewTimers.current.delete(activeTimerId);
      setTimers((prev) => prev.filter((t) => t.id !== activeTimerId));
    }
    setRoute('library');
  }, [activeTimerId]);

  const handleRestore = useCallback(async (id: string) => {
    const canonical = await restoreBundledTimer(id);
    if (!canonical) return;
    setTimers((prev) => prev.map((t) => (t.id === id ? canonical : t)));
  }, []);

  const handleDeleteTimer = useCallback(async (id: string) => {
    await deleteTimer(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
    setRoute('library');
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh' } as React.CSSProperties}>
      {route === 'onboarding' && <Onboarding onDone={handleOnboardingDone} />}
      {route === 'library' && (
        <Library
          timers={timers}
          onOpen={handleOpenTimer}
          onRun={handleRunTimer}
          onNew={handleNewTimer}
        />
      )}
      {route === 'builder' && activeTimer && (
        <Builder
          timer={activeTimer}
          onChange={handleTimerChange}
          onRun={() => setRoute('run')}
          onBack={handleBack}
          onRestore={handleRestore}
          onDelete={handleDeleteTimer}
        />
      )}
      {route === 'run' && activeTimer && (
        <Run
          timer={activeTimer}
          onExit={() => setRoute('builder')}
          onComplete={() => setRoute('complete')}
        />
      )}
      {route === 'complete' && activeTimer && (
        <Completion
          timer={activeTimer}
          onRestart={() => setRoute('run')}
          onExit={() => setRoute('library')}
        />
      )}
    </div>
  );
}
