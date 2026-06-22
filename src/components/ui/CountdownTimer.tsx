"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  className?: string;
}

export function CountdownTimer({ targetDate, label, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const blocks = [
    { value: timeLeft.days, unit: "Days" },
    { value: timeLeft.hours, unit: "Hours" },
    { value: timeLeft.minutes, unit: "Min" },
    { value: timeLeft.seconds, unit: "Sec" },
  ];

  return (
    <div className={className}>
      {label && (
        <p className="text-sm text-slate-500 mb-3 text-center">{label}</p>
      )}
      {isExpired ? (
        <p className="text-emerald-600 font-semibold text-center">Test window is open!</p>
      ) : (
        <div className="flex justify-center gap-3">
          {blocks.map(({ value, unit }) => (
            <div
              key={unit}
              className="flex flex-col items-center bg-navy-900 text-white rounded-xl px-4 py-3 min-w-[70px]"
            >
              <span className="text-2xl font-bold font-display">
                {String(value).padStart(2, "0")}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">{unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
