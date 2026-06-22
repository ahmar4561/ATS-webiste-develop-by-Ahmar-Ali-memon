"use client";

import { useEffect, useState } from "react";
import { MeritEntry } from "@/lib/types";
import { TESTS } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatTime } from "@/lib/questions";
import { Trophy, Medal, Users, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { CertificateModal } from "@/components/certificate/Certificate";

export default function MeritPage() {
  const { student } = useAuth();
  const [merit, setMerit] = useState<MeritEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [certEntry, setCertEntry] = useState<MeritEntry | null>(null);

  useEffect(() => {
    const url =
      filter === "all" ? "/api/merit" : `/api/merit?testId=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setMerit(data.merit ?? []);
        setLoading(false);
      });
  }, [filter]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-gold-500" />;
    if (rank <= 3) return <Medal className="w-5 h-5 text-slate-400" />;
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          All-Pakistan Rankings
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-900 mb-3">
          Merit List
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Rankings calculated automatically. Tie-breaker: higher score wins;
          equal scores ranked by less time taken.
        </p>
        <p className="text-xs text-slate-400 max-w-xl mx-auto mt-2">
          Top 10 certificates remain available to download for one week,
          until the next Mock Test&apos;s merit list is published.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-navy-900 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          All Tests
        </button>
        {TESTS.filter((t) => t.mode === "online").map((test) => (
          <button
            key={test.id}
            onClick={() => setFilter(test.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              filter === test.id
                ? "bg-navy-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {test.title}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-navy-900">
              Rankings
            </h2>
            <Badge variant="info">{merit.length} entries</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-400 animate-pulse">
              Loading merit list...
            </div>
          ) : merit.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No results yet. Complete a mock test to appear on the merit list.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Rank</th>
                  <th className="pb-3 pr-4 font-medium">Roll No.</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium hidden sm:table-cell">
                    City
                  </th>
                  {filter === "all" && (
                    <th className="pb-3 pr-4 font-medium hidden md:table-cell">
                      Test
                    </th>
                  )}
                  <th className="pb-3 pr-4 font-medium">Score</th>
                  <th className="pb-3 pr-4 font-medium hidden sm:table-cell">
                    %
                  </th>
                  <th className="pb-3 pr-4 font-medium hidden lg:table-cell">
                    Time
                  </th>
                  <th className="pb-3 font-medium hidden lg:table-cell">
                    Cert
                  </th>
                </tr>
              </thead>
              <tbody>
                {merit.map((entry) => (
                  <tr
                    key={`${entry.testId}-${entry.rollNumber || "norollnum"}-${entry.rank}`}
                    className={cn(
                      "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                      entry.rank <= 10 && "bg-gold-50/30"
                    )}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                        <span className="font-bold text-navy-900">
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {entry.rollNumber ? (
                        entry.rollNumber
                      ) : (
                        <span className="text-slate-400 italic">
                          Not assigned yet
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-medium">{entry.name}</td>
                    <td className="py-3 pr-4 hidden sm:table-cell text-slate-500">
                      {entry.city}
                    </td>
                    {filter === "all" && (
                      <td className="py-3 pr-4 hidden md:table-cell text-slate-500">
                        {entry.testTitle}
                      </td>
                    )}
                    <td className="py-3 pr-4 font-bold text-emerald-600">
                      {entry.score}
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      {entry.percentage.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell font-mono text-xs">
                      {formatTime(entry.timeTakenSeconds)}
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      {entry.rank <= 10 &&
                        (student &&
                        entry.rollNumber &&
                        student.rollNumber.toUpperCase() ===
                          entry.rollNumber.toUpperCase() ? (
                          <button
                            onClick={() => setCertEntry(entry)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-50 text-gold-700 border border-gold-200 hover:bg-gold-100 transition-colors"
                          >
                            <Award className="w-3.5 h-3.5" />
                            Get Certificate
                          </button>
                        ) : (
                          <Badge variant="warning">Top 10</Badge>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {certEntry && (
        <CertificateModal
          studentName={certEntry.name}
          rollNumber={certEntry.rollNumber}
          testTitle={certEntry.testTitle}
          rank={certEntry.rank}
          score={certEntry.score}
          percentage={certEntry.percentage}
          onClose={() => setCertEntry(null)}
        />
      )}
    </div>
  );
}
