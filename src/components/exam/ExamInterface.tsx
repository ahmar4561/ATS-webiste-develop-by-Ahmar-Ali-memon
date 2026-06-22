"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Question, TestAnswer } from "@/lib/types";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { EXAM_DURATION_SECONDS, SUBJECT_LABELS } from "@/lib/types";
import { getTestWindowStatus } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  Clock,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamInterfaceProps {
  testId: string;
  testDate: string;
  testTitle: string;
  rollNumber: string;
  questions: Question[];
  initialAnswers: TestAnswer[];
  initialElapsed?: number;
}

export function ExamInterface({
  testId,
  testDate,
  testTitle,
  rollNumber,
  questions,
  initialAnswers,
  initialElapsed = 0,
}: ExamInterfaceProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<TestAnswer[]>(initialAnswers);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  const submitTest = useCallback(
    async (reason: "manual" | "timeout" | "tab_switch" = "manual", elapsed?: number) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setIsFrozen(true);

      const timeTaken = elapsed ?? EXAM_DURATION_SECONDS;

      await fetch("/api/attempts/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          rollNumber,
          testId,
          answers,
          timeTakenSeconds: timeTaken,
          autoSubmitReason: reason === "manual" ? undefined : reason,
        }),
      });

      router.push(`/results/${testId}`);
    },
    [isSubmitting, rollNumber, testId, answers, router]
  );

  const { formatted, elapsed, isLow, isCritical } = useExamTimer({
    initialSeconds: EXAM_DURATION_SECONDS - initialElapsed,
    onTimeout: () => submitTest("timeout", EXAM_DURATION_SECONDS),
    isActive: !isFrozen && !isSubmitting,
  });

  const { showWarning, dismissWarning } = useAntiCheat({
    enabled: !isFrozen && !isSubmitting,
    onAutoSubmit: () => submitTest("tab_switch", elapsed + initialElapsed),
  });

  useEffect(() => {
    const saveInterval = setInterval(async () => {
      if (isFrozen) return;
      await fetch("/api/attempts/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_progress",
          rollNumber,
          testId,
          answers,
          timeTakenSeconds: elapsed + initialElapsed,
        }),
      });
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [answers, elapsed, initialElapsed, rollNumber, testId, isFrozen]);

  // Hard cutoff: force-submit if the daily 10 AM-10 PM window closes
  // while the student is still mid-test.
  useEffect(() => {
    if (isFrozen || isSubmitting) return;

    const checkWindow = () => {
      if (getTestWindowStatus(testDate) === "expired") {
        submitTest("timeout", elapsed + initialElapsed);
      }
    };

    checkWindow();
    const windowInterval = setInterval(checkWindow, 15000);
    return () => clearInterval(windowInterval);
  }, [testDate, isFrozen, isSubmitting, elapsed, initialElapsed, submitTest]);

  // Block right-click, copy/cut/paste, and common dev-tools shortcuts
  // while the exam is active, as an additional anti-cheating layer.
  useEffect(() => {
    if (isFrozen) return;

    const blockEvent = (e: Event) => e.preventDefault();

    const blockShortcuts = (e: KeyboardEvent) => {
      const blockedKeys = ["F12", "PrintScreen"];
      const isDevToolsCombo =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["I", "J", "C"].includes(e.key.toUpperCase());
      const isViewSourceCombo = (e.ctrlKey || e.metaKey) && e.key.toUpperCase() === "U";

      if (blockedKeys.includes(e.key) || isDevToolsCombo || isViewSourceCombo) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("paste", blockEvent);
    document.addEventListener("keydown", blockShortcuts);

    return () => {
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("paste", blockEvent);
      document.removeEventListener("keydown", blockShortcuts);
    };
  }, [isFrozen]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id);

  const selectAnswer = (optionIndex: number) => {
    if (isFrozen) return;
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === currentQuestion.id
          ? { ...a, selectedIndex: optionIndex }
          : a
      )
    );
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  const answeredCount = answers.filter((a) => a.selectedIndex !== null).length;

  return (
    <div className="exam-mode min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-navy-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">ATS · {testTitle}</p>
            <p className="font-semibold text-sm">Roll: {rollNumber}</p>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold",
              isCritical
                ? "bg-red-600 animate-pulse"
                : isLow
                ? "bg-gold-500"
                : "bg-emerald-600"
            )}
          >
            <Clock className="w-5 h-5" />
            {formatted}
          </div>

          <div className="text-sm text-slate-300">
            Answered: {answeredCount}/{questions.length}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Question Panel */}
        <main className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-display font-bold text-navy-900">
                  Q{currentQuestion.id}
                </span>
                <Badge variant="info">
                  {SUBJECT_LABELS[currentQuestion.subject]}
                </Badge>
              </div>
              <button
                onClick={toggleFlag}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  flagged.has(currentQuestion.id)
                    ? "bg-gold-100 text-gold-600"
                    : "hover:bg-slate-100 text-slate-400"
                )}
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>

            <p className="text-navy-900 leading-relaxed mb-8 text-base lg:text-lg">
              {currentQuestion.text}
            </p>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = currentAnswer?.selectedIndex === idx;
                const labels = ["A", "B", "C", "D"];
                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    disabled={isFrozen}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0",
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {labels[idx]}
                    </span>
                    <span className="text-sm lg:text-base pt-1">{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0 || isFrozen}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                {currentIndex + 1} of {questions.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                disabled={currentIndex === questions.length - 1 || isFrozen}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="danger"
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isFrozen}
            >
              <Send className="w-4 h-4" />
              Submit Test
            </Button>
          </div>
        </main>

        {/* Question Navigator */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-24">
            <h3 className="font-semibold text-navy-900 mb-3 text-sm">
              Question Navigator
            </h3>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5 max-h-[400px] overflow-y-auto">
              {questions.map((q, idx) => {
                const ans = answers.find((a) => a.questionId === q.id);
                const isAnswered = ans?.selectedIndex !== null;
                const isCurrent = idx === currentIndex;
                const isFlagged = flagged.has(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-full aspect-square rounded-lg text-xs font-semibold transition-all relative",
                      isCurrent && "ring-2 ring-emerald-500 ring-offset-1",
                      isAnswered
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      isFlagged && "border-2 border-gold-400"
                    )}
                  >
                    {q.id}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                Answered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200" />
                Unattempted
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-gold-400" />
                Flagged
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Anti-cheat Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="font-display font-bold text-xl">Warning!</h3>
            </div>
            <p className="text-slate-600 mb-2">
              Tab switching and leaving the exam window is strictly prohibited.
            </p>
            <p className="text-red-600 font-semibold text-sm mb-6">
              If you switch tabs or minimize again, your test will be
              AUTO-SUBMITTED immediately and locked permanently.
            </p>
            <Button className="w-full" onClick={dismissWarning}>
              I Understand — Return to Test
            </Button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display font-bold text-xl text-navy-900 mb-2">
              Confirm Submission
            </h3>
            <p className="text-slate-600 mb-2">
              You have answered {answeredCount} of {questions.length} questions.
            </p>
            <p className="text-red-600 text-sm font-medium mb-6">
              Once submitted, you cannot re-attempt this test.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => submitTest("manual", elapsed + initialElapsed)}
              >
                Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
