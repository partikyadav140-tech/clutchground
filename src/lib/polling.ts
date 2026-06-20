/**
 * Shared polling utility with exponential backoff and proper cleanup.
 * Prevents "too many requests" by throttling API calls and backing off on errors.
 */

// ── Shared Polling Manager ────────────────────────────────────────────────
// Ensures only one polling interval runs per key across all component instances.

const activePollers = new Map<
  string,
  {
    intervalId: ReturnType<typeof setInterval> | null;
    refCount: number;
    baseInterval: number;
    currentInterval: number;
    consecutiveErrors: number;
  }
>();

const MAX_BACKOFF_INTERVAL = 60_000; // Max 60 seconds between polls
const BACKOFF_MULTIPLIER = 2;
const ERRORS_BEFORE_BACKOFF = 2;

export function startPolling(
  key: string,
  callback: () => Promise<void>,
  baseIntervalMs: number = 15_000,
): () => void {
  const existing = activePollers.get(key);

  if (existing) {
    existing.refCount++;
    return () => stopPolling(key);
  }

  const poller = {
    intervalId: null as ReturnType<typeof setInterval> | null,
    refCount: 1,
    baseInterval: baseIntervalMs,
    currentInterval: baseIntervalMs,
    consecutiveErrors: 0,
  };

  const runPoll = async () => {
    try {
      await callback();
      poller.consecutiveErrors = 0;
      // Reset to base interval on success
      if (poller.currentInterval !== poller.baseInterval) {
        poller.currentInterval = poller.baseInterval;
        if (poller.intervalId) clearInterval(poller.intervalId);
        poller.intervalId = setInterval(runPoll, poller.currentInterval);
      }
    } catch {
      poller.consecutiveErrors++;
      if (poller.consecutiveErrors >= ERRORS_BEFORE_BACKOFF) {
        const newInterval = Math.min(
          poller.currentInterval * BACKOFF_MULTIPLIER,
          MAX_BACKOFF_INTERVAL,
        );
        if (newInterval !== poller.currentInterval) {
          poller.currentInterval = newInterval;
          if (poller.intervalId) clearInterval(poller.intervalId);
          poller.intervalId = setInterval(runPoll, poller.currentInterval);
        }
      }
    }
  };

  poller.intervalId = setInterval(runPoll, poller.currentInterval);
  activePollers.set(key, poller);

  // Run immediately on first mount
  runPoll();

  return () => stopPolling(key);
}

function stopPolling(key: string) {
  const poller = activePollers.get(key);
  if (!poller) return;

  poller.refCount--;
  if (poller.refCount <= 0) {
    if (poller.intervalId) clearInterval(poller.intervalId);
    activePollers.delete(key);
  }
}

/**
 * Fetch wrapper that handles 429 responses with retry-after.
 */
export async function fetchWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 2,
): Promise<any> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (msg.includes("429") || msg.includes("Too Many") || msg.includes("rate limit")) {
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
      throw err;
    }
  }
  throw lastError;
}
