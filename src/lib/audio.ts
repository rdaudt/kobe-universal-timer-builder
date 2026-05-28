let ctx: AudioContext | null = null;
let muted = false;
let volume = 0.7;

export function initAudio(): void {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

export function setVolume(v: number): void { volume = v; }
export function setMuted(m: boolean): void { muted = m; }

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx) return null;
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, gain = 0.4, type: OscillatorType = 'sine', delay = 0): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = type;
  osc.frequency.value = freq;
  const now = c.currentTime + delay;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(volume * gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export function playBlockStart(): void {
  tone(880, 0.12, 0.35);
  tone(1100, 0.12, 0.25, 'sine', 0.08);
}

export function playBlockEnd(): void {
  tone(660, 0.15, 0.3);
}

export function playRestChime(): void {
  tone(440, 0.3, 0.3);
  tone(330, 0.3, 0.2, 'sine', 0.1);
}

export function playCountdownBeep(beepNumber: number): void {
  const freqs = [880, 770, 660];
  tone(freqs[beepNumber] ?? 660, 0.1, 0.4);
}

export function playCompletion(): void {
  tone(523, 0.18, 0.4);
  tone(659, 0.18, 0.4, 'sine', 0.2);
  tone(784, 0.18, 0.4, 'sine', 0.4);
  tone(1047, 0.5, 0.5, 'sine', 0.62);
}
