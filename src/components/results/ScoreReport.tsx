"use client";

import { Question, TestAttempt } from "@/lib/types";
import { SUBJECT_LABELS, MARKS_CORRECT, MARKS_WRONG } from "@/lib/types";
import { formatTime } from "@/lib/questions";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Trophy,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreReportProps {
  attempt: TestAttempt;
  questions: Question[];
  studentName: string;
  testTitle: string;
}

export function ScoreReport({
  attempt,
  questions,
  studentName,
  testTitle,
}: ScoreReportProps) {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const stats = [
    {
      label: "Total Score (out of 180)",
      value: attempt.score,
      icon: Trophy,
      color: "text-gold-500 bg-gold-50",
    },
    {
      label: "Correct",
      value: attempt.correct,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Wrong",
      value: attempt.wrong,
      icon: XCircle,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Unattempted",
      value: attempt.unattempted,
      icon: MinusCircle,
      color: "text-slate-600 bg-slate-100",
    },
    {
      label: "Percentage",
      value: `${attempt.percentage.toFixed(1)}%`,
      icon: Percent,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Time Taken",
      value: formatTime(attempt.timeTakenSeconds),
      icon: Clock,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-navy-900 mb-2">
          Test Results
        </h1>
        <p className="text-slate-600">
          {testTitle} · {studentName} ({attempt.rollNumber})
        </p>
        {attempt.autoSubmitReason && attempt.autoSubmitReason !== "manual" && (
          <Badge variant="danger" className="mt-2">
            Auto-submitted due to{" "}
            {attempt.autoSubmitReason === "tab_switch"
              ? "tab switching violation"
              : "time expiry"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 text-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2",
                  color
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-display font-bold text-navy-900">
                {value}
              </p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display font-bold text-xl text-navy-900">
            Question-by-Question Breakdown
          </h2>
          <p className="text-sm text-slate-500">
            +{MARKS_CORRECT} correct · {MARKS_WRONG} wrong · 0 unattempted
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto print:max-h-none print:overflow-visible">
            {attempt.answers.map((answer) => {
              const question = questionMap.get(answer.questionId)!;
              const isUnattempted = answer.selectedIndex === null;
              const isCorrect =
                !isUnattempted && answer.selectedIndex === question.correctIndex;

              return (
                <div
                  key={answer.questionId}
                  className={cn(
                    "p-4 rounded-xl border text-sm",
                    isUnattempted
                      ? "border-slate-200 bg-slate-50"
                      : isCorrect
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-red-200 bg-red-50/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-navy-900">
                      Q{answer.questionId}
                    </span>
                    <Badge variant="info" className="text-[10px]">
                      {SUBJECT_LABELS[question.subject]}
                    </Badge>
                    {isUnattempted ? (
                      <Badge variant="default">Unattempted</Badge>
                    ) : isCorrect ? (
                      <Badge variant="success">Correct</Badge>
                    ) : (
                      <Badge variant="danger">Wrong</Badge>
                    )}
                  </div>
                  <p className="text-slate-700 mb-2 line-clamp-2">
                    {question.text}
                  </p>
                  {!isUnattempted && !isCorrect && (
                    <p className="text-red-600 text-xs mb-1">
                      Your answer: {question.options[answer.selectedIndex!]}
                    </p>
                  )}
                  <p className="text-emerald-700 text-xs">
                    ✓ {question.options[question.correctIndex]}
                  </p>
                  <p className="text-slate-500 text-xs mt-2 italic">
                    {question.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
