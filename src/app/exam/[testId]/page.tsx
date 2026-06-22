"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getTestById,
  formatTestDate,
  getNextSundayCountdown,
  getTestWindowStatus,
} from "@/lib/constants";
import { ExamInterface } from "@/components/exam/ExamInterface";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { Question, TestAttempt } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Lock, AlertTriangle, TimerOff } from "lucide-react";

export default function ExamPage() {
  const params = useParams();
  const testId = params.testId as string;
  const { student, isLoading } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const test = getTestById(testId);

  useEffect(() => {
    if (!isLoading && !student) {
      router.push("/login");
    }
  }, [student, isLoading, router]);

  useEffect(() => {
    if (!student || !test) return;

    async function load() {
      const [qRes, aRes] = await Promise.all([
        fetch(`/api/questions?testId=${testId}`),
        fetch(`/api/attempts?rollNumber=${student!.rollNumber}&testId=${testId}`),
      ]);

      const qData = await qRes.json();
      const aData = await aRes.json();

      if (!qRes.ok) {
        setError(qData.error ?? "Failed to load test");
        setLoading(false);
        return;
      }

      setQuestions(qData.questions);

      if (aData.attempt) {
        const att = aData.attempt as TestAttempt;
        if (att.status === "completed" || att.status === "auto_submitted") {
          router.push(`/results/${testId}`);
          return;
        }
        setAttempt(att);
      }

      setLoading(false);
    }

    load();
  }, [student, test, testId, router]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500 animate-pulse">Loading examination...</div>
      </div>
    );
  }

  if (!student || !test) {
    return null;
  }

  if (test.mode === "physical") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-gold-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">
            Physical Mock Test
          </h1>
          <p className="text-slate-600 mb-6">
            Separate registration for Mega Physical Mock Test is coming soon.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const windowStatus = getTestWindowStatus(test.date);
  const isOpen = windowStatus === "open";

  if (windowStatus === "expired" && !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <TimerOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">
            Time Out
          </h1>
          <p className="text-slate-600 mb-6">
            Today&apos;s testing window (10:00 AM – 10:00 PM) for{" "}
            <strong>{test.title}</strong> has closed. This test is no longer
            available.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isOpen && !attempt) {
    const { targetDate } = getNextSundayCountdown(test.date);
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">
            Test Locked
          </h1>
          <p className="text-slate-600 mb-6">
            This test will strictly open on Sunday,{" "}
            <strong>{formatTestDate(test.date)}</strong> from{" "}
            <strong>10:00 AM – 10:00 PM</strong>
          </p>
          <CountdownTimer targetDate={targetDate} className="mb-6" />
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const startTest = async () => {
    setStarting(true);
    const res = await fetch("/api/attempts/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        rollNumber: student.rollNumber,
        testId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Cannot start test");
      setStarting(false);
      return;
    }

    setAttempt(data.attempt);
    setStarting(false);
  };

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">
            {test.title}
          </h1>
          <p className="text-slate-600 mb-6">
            You are about to begin a 3-hour, 180-question MDCAT mock test.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm space-y-2">
            <p className="font-semibold text-red-700">Important Rules:</p>
            <ul className="list-disc list-inside text-red-600 space-y-1">
              <li>Only ONE attempt allowed — no re-entry after submission</li>
              <li>Switching tabs or minimizing will AUTO-SUBMIT your test</li>
              <li>Right-click, copy, and paste are disabled during the test</li>
              <li>Test auto-submits when timer reaches 00:00:00</li>
              <li>Test auto-submits if the daily 10 AM–10 PM window closes</li>
              <li>Negative marking: +4 correct, -1 wrong, 0 unattempted</li>
            </ul>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              className="flex-1"
              onClick={startTest}
              disabled={starting}
            >
              {starting ? "Starting..." : "Start Test"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ExamInterface
      testId={testId}
      testDate={test.date}
      testTitle={test.title}
      rollNumber={student.rollNumber}
      questions={questions}
      initialAnswers={attempt.answers}
      initialElapsed={attempt.timeTakenSeconds}
    />
  );
}
