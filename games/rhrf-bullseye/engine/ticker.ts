type Tick = (now: number) => void;
const subs = new Set<Tick>();
let interval: ReturnType<typeof setInterval> | null = null;

function pump() {
  const now = performance.now();
  subs.forEach((fn) => { try { fn(now); } catch {} });
}

function ensureDriver() {
  if (interval) return;
  interval = setInterval(pump, 16);
}

export function subscribe(fn: Tick): () => void {
  ensureDriver();
  subs.add(fn);
  return () => {
    subs.delete(fn);
    if (!subs.size && interval) { clearInterval(interval); interval = null; }
  };
}
