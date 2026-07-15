"use client";

import { useState, useEffect } from "react";
import { X, Zap, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TESTS } from "@/lib/constants";

export function MegaPhysicalBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const megaTest = TESTS.find((t) => t.mode === "physical");

  useEffect(() => {
    // Show banner after 2 seconds
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(() => setVisible(false), 400);
  };

  const handleRegister = () => {
    handleDismiss();
    // Scroll to Schedule section where the register button is
    document.getElementById("schedule-section")?.scrollIntoView({ behavior: "smooth" });
  };

  if (!megaTest || !visible) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl transition-all duration-400 ${
        dismissed ? "opacity-0 translate-y-8 pointer-events-none" : "opacity-100 translate-y-0"
      }`}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gold-400/30">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        {/* Gold shimmer strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 via-yellow-300 to-gold-400" />

        <div className="relative px-5 py-4 flex items-center gap-4">
          {/* ATS Logo / Icon */}
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ats-logo-transparent.png"
              alt="ATS"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <Zap className="w-6 h-6 text-gold-400 hidden" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-gold-400 text-xs font-bold tracking-widest uppercase">
                🔥 Mega Physical Test
              </span>
            </div>
            <p className="text-white font-display font-bold text-base leading-tight">
              ATS Mega Physical Mock Test 2026
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-slate-300 text-xs">
                <Calendar className="w-3 h-3" />
                26 July 2026
              </span>
              <span className="flex items-center gap-1 text-gold-400 text-xs">
                <MapPin className="w-3 h-3" />
                Venue: Coming Soon
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <Button
              size="sm"
              onClick={handleRegister}
              className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-xs px-3 py-1.5 h-auto"
            >
              Register Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
