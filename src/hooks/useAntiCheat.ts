"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseAntiCheatOptions {
  enabled: boolean;
  onAutoSubmit: (reason: "tab_switch") => void;
}

export function useAntiCheat({ enabled, onAutoSubmit }: UseAntiCheatOptions) {
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const isHandlingRef = useRef(false);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  onAutoSubmitRef.current = onAutoSubmit;

  const handleViolation = useCallback(() => {
    if (!enabled || isHandlingRef.current) return;

    setWarningCount((prev) => {
      const next = prev + 1;
      if (next >= 2) {
        isHandlingRef.current = true;
        setShowWarning(false);
        onAutoSubmitRef.current("tab_switch");
      } else {
        setShowWarning(true);
      }
      return next;
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };

    const onBlur = () => handleViolation();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled, handleViolation]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  return { showWarning, warningCount, dismissWarning };
}
