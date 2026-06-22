"use client";

import { useEffect, useState } from "react";
import { StaticTopEntry } from "@/lib/types";
import { getLatestClosedTest } from "@/lib/constants";
import { Trophy, Medal, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DisplayEntry {
  rank: number;
  name: string;
  city: string;
  score: number;
  percentage: number;
}

export function TodaysToppers() {
  const [entries, setEntries] = useState<DisplayEntry[] | null>(null);
  const [testTitle, setTestTitle] = useState<string>("");
  const [testDate, setTestDate] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const closedTest = getLatestClosedTest();
    if (!closedTest) return;
    setTestTitle(closedTest.title);
    setTestDate(closedTest.date);

    // ---- Priority 1: use hardcoded staticTop10 if present ----
    if (closedTest.staticTop10 && closedTest.staticTop10.length > 0) {
      const mapped: DisplayEntry[] = closedTest.staticTop10.map(
        (s: StaticTopEntry) => ({
          rank: s.rank,
          name: s.name,
          city: s.city,
          score: s.score,
          percentage: (s.score / s.totalMarks) * 100,
        })
      );
      setEntries(mapped);
      setOpen(true);
      return;
    }

    // ---- Priority 2: fall back to live DB data ----
    fetch(`/api/merit?testId=${closedTest.id}`)
      .then((r) => r.json())
      .then((data) => {
        const top10 = (data.merit ?? []).slice(0, 10);
        if (top10.length > 0) {
          const mapped: DisplayEntry[] = top10.map(
            (e: { rank: number; name: string; city: string; score: number; percentage: number }) => ({
              rank: e.rank,
              name: e.name,
              city: e.city,
              score: e.score,
              percentage: Number(e.percentage),
            })
          );
          setEntries(mapped);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!open || !entries) return null;

  const getRankDisplay = (rank: number) => {
    if (rank === 1)
      return (
        <span className="flex items-center gap-1 text-amber-600 font-bold text-sm">
          <Trophy className="w-4 h-4" />
          #1
        </span>
      );
    if (rank === 2 || rank === 3)
      return (
        <span className="flex items-center gap-1 text-slate-500 font-bold text-sm">
          <Medal className="w-4 h-4" />#{rank}
        </span>
      );
    return (
      <span className="font-bold text-navy-700 text-sm w-8">#{rank}</span>
    );
  };

  const dateStr = testDate
    ? new Date(testDate + "T12:00:00").toLocaleDateString("en-PK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-900 px-6 py-5 text-white relative">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold tracking-widest text-amber-400 uppercase">
              All-Pakistan Merit List
            </span>
          </div>
          <h3 className="font-display font-bold text-xl">
            Top 10 — {testTitle}
          </h3>
          {dateStr && (
            <p className="text-xs text-slate-300 mt-1">{dateStr}</p>
          )}
        </div>

        {/* Gold accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1.5">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors",
                entry.rank === 1
                  ? "bg-amber-50 border-amber-200"
                  : entry.rank <= 3
                  ? "bg-slate-50 border-slate-200"
                  : "bg-white border-slate-100"
              )}
            >
              {/* Rank */}
              <div className="shrink-0 w-10 flex justify-center">
                {getRankDisplay(entry.rank)}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-semibold truncate text-sm",
                    entry.rank === 1 ? "text-amber-800" : "text-navy-900"
                  )}
                >
                  {entry.name}
                </p>
                {entry.city && (
                  <p className="text-xs text-slate-400 truncate">{entry.city}</p>
                )}
              </div>

              {/* Score + Percentage */}
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "font-bold text-sm",
                    entry.rank === 1 ? "text-amber-700" : "text-emerald-600"
                  )}
                >
                  {entry.score} marks
                </p>
                <p className="text-xs text-slate-400">
                  {entry.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Top students can download their certificate from Merit List.
          </p>
          <Link
            href="/merit"
            onClick={() => setOpen(false)}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 shrink-0 pl-3"
          >
            View All →
          </Link>
        </div>
      </div>
    </div>
  );
}
