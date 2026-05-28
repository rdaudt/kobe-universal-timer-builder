// Web Worker: high-accuracy tick loop using performance.now()
// Messages IN:  { type: 'start' | 'pause' | 'resume' | 'stop' }
// Messages OUT: { type: 'tick', elapsed: number } — elapsed in ms since start

let startTime: number | null = null;
let pausedAt: number | null = null;
let totalPausedMs = 0;
let running = false;
let handle: ReturnType<typeof setInterval> | null = null;

function tick() {
  if (!running || startTime === null) return;
  const elapsed = performance.now() - startTime - totalPausedMs;
  self.postMessage({ type: 'tick', elapsed });
}

self.onmessage = (e: MessageEvent) => {
  const { type } = e.data as { type: string };
  switch (type) {
    case 'start':
      startTime = performance.now();
      totalPausedMs = 0;
      pausedAt = null;
      running = true;
      if (handle) clearInterval(handle);
      handle = setInterval(tick, 100);
      break;
    case 'pause':
      if (running) {
        running = false;
        pausedAt = performance.now();
      }
      break;
    case 'resume':
      if (!running && pausedAt !== null) {
        totalPausedMs += performance.now() - pausedAt;
        pausedAt = null;
        running = true;
      }
      break;
    case 'stop':
      running = false;
      if (handle) clearInterval(handle);
      handle = null;
      startTime = null;
      break;
  }
};
