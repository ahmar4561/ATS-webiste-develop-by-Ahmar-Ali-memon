"use client";

import { useState, useEffect, useRef } from "react";
import { EXAM_DURATION_SECONDS } from "@/lib/types";
import { formatTime } from "@/lib/questions";

interface UseExamTimerOptions {
  initialSeconds?: number;
  onTimeout: () => void;
  isActive: boolean;
}

export function useExamTimer({
  initialSeconds = EXAM_DURATION_SECONDS,
  onTimeout,
  isActive,
}: UseExamTimerOptions) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [elapsed, setElapsed] = useState(0);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatted = formatTime(remaining);
  const isLow = remaining <= 600;
  const isCritical = remaining <= 60;

  return { remaining, elapsed, formatted, isLow, isCritical };
}
