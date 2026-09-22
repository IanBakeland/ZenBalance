import { useCallback, useEffect, useRef, useState } from 'react';

export type SessionOutcome = 'success' | 'cancelled' | 'moved';

interface UseSessionTimerOptions {
  durationSeconds: number;
  onComplete: (outcome: SessionOutcome) => void;
}

/**
 * Countdown driven by `Date.now()`, never raw tick counts (PROJECT_PLAN.md section 7,
 * Step 4) — setInterval ticks drift, especially once the app backgrounds/foregrounds.
 */
export function useSessionTimer({ durationSeconds, onComplete }: UseSessionTimerOptions) {
  // Lazy useState initializer, not useRef(Date.now()) — the initializer is the
  // one render-safe place for one-time impure work (react-hooks/purity).
  const [startTime] = useState(() => Date.now());
  const finished = useRef(false);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Shared by the internal "time's up" tick and any external caller (manual
  // Stop, the stillness detector) — first one to call it wins, and it stops
  // the interval right away rather than leaving it ticking after an outcome.
  const finish = useCallback((outcome: SessionOutcome) => {
    if (finished.current) return;
    finished.current = true;
    if (intervalId.current !== null) clearInterval(intervalId.current);
    onCompleteRef.current(outcome);
  }, []);

  useEffect(() => {
    const tick = () => {
      const remaining = durationSeconds - (Date.now() - startTime) / 1000;
      setRemainingSeconds(Math.max(0, remaining));
      if (remaining <= 0) finish('success');
    };

    tick();
    intervalId.current = setInterval(tick, 250);
    return () => {
      if (intervalId.current !== null) clearInterval(intervalId.current);
    };
  }, [durationSeconds, startTime, finish]);

  return { remainingSeconds, finish };
}
