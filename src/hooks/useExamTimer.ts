"use client";

import { useState, useEffect, useRef } from "react";
import { EXAM_DURATION_SECONDS } from "@/lib/types";
import { formatTime } from "@/lib/questions";

interface UseExamTimerOptions {
  /** Absolute ISO timestamp of when this attempt was started on the server. */
  startedAt: string | null;
  onTimeout: () => void;
  isActive: boolean;
}

/**
 * A wall-clock based exam timer: remaining time is always computed from
 * `now - startedAt`, not from a setInterval tick counter. This matters
 * because browsers (especially on mobile) throttle or fully suspend
 * setInterval timers while a tab is backgrounded/minimized -- a
 * tick-based timer would silently stop counting down while the student
 * is away, making the "real" 3-hour limit unenforceable. Computing from
 * absolute timestamps means the countdown is always correct the instant
 * the student returns, with no drift and no need to track elapsed time
 * while hidden.
 */
export function useExamTimer({
  startedAt,
  onTimeout,
  isActive,
}: UseExamTimerOptions) {
  const startMs = startedAt ? new Date(startedAt).getTime() : Date.now();
  const deadlineMs = startMs + EXAM_DURATION_SECONDS * 1000;

  const computeRemaining = () =>
    Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));

  const [remaining, setRemaining] = useState(computeRemaining);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isActive) return;

    // Re-sync immediately (covers the case where the tab was hidden for a
    // while and just became visible again -- don't wait for the next
    // tick to catch up).
    setRemaining(computeRemaining());

    const tick = () => {
      const next = computeRemaining();
      setRemaining(next);
      if (next <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeoutRef.current();
      }
    };

    const interval = setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, deadlineMs]);

  const elapsed = Math.min(
    EXAM_DURATION_SECONDS,
    Math.max(0, Math.round((Date.now() - startMs) / 1000))
  );
  const formatted = formatTime(remaining);
  const isLow = remaining <= 600;
  const isCritical = remaining <= 60;

  return { remaining, elapsed, formatted, isLow, isCritical };
}
