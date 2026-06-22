"use client";

import Link from "next/link";
import { TestDefinition } from "@/lib/types";
import {
  formatTestDate,
  isTestDayOpen,
  getNextSundayCountdown,
  getTestWindowStatus,
} from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import {
  Calendar,
  Clock,
  Lock,
  Play,
  CheckCircle,
  AlertTriangle,
  FileText,
  TimerOff,
} from "lucide-react";
import { AttemptStatus } from "@/lib/types";

interface TestCardProps {
  test: TestDefinition;
  attemptStatus?: AttemptStatus;
  onExpandSyllabus?: () => void;
  isSyllabusOpen?: boolean;
}

export function TestCard({
  test,
  attemptStatus = "not_started",
  onExpandSyllabus,
  isSyllabusOpen,
}: TestCardProps) {
  const isOpen = test.mode === "online" && isTestDayOpen(test.date);
  const isPhysical = test.mode === "physical";
  const isCompleted =
    attemptStatus === "completed" || attemptStatus === "auto_submitted";
  const isInProgress = attemptStatus === "in_progress";
  const { targetDate } = getNextSundayCountdown(test.date);
  const windowStatus = test.mode === "online" ? getTestWindowStatus(test.date) : "locked";
  const isExpiredToday = windowStatus === "expired";

  const statusBadge = () => {
    if (isPhysical) return <Badge variant="warning">Coming Soon</Badge>;
    if (isCompleted)
      return (
        <Badge variant="info">
          {attemptStatus === "auto_submitted" ? "Auto-Submitted" : "Attempted"}
        </Badge>
      );
    if (isInProgress) return <Badge variant="warning">In Progress</Badge>;
    if (isOpen) return <Badge variant="success">Open Now</Badge>;
    if (isExpiredToday) return <Badge variant="danger">Time Out</Badge>;
    return <Badge variant="default">Locked</Badge>;
  };

  return (
    <Card hover className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              Mock Test {test.number}
            </p>
            <h3 className="font-display font-bold text-xl text-navy-900">
              {test.title}
            </h3>
          </div>
          {statusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-500" />
            {formatTestDate(test.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            3 Hours · 180 MCQs
          </span>
        </div>

        {isPhysical ? (
          <div className="bg-gold-50 border border-gold-100 rounded-xl p-4 text-sm text-gold-700">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Separate Registration Coming Soon for Mega Physical Mock Test
          </div>
        ) : isExpiredToday && !isCompleted && !isInProgress ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 text-center">
            <TimerOff className="w-5 h-5 inline mr-2" />
            Time Out — Today&apos;s 10:00 AM–10:00 PM window has closed.
            This test is no longer available.
          </div>
        ) : !isOpen && !isCompleted && !isInProgress ? (
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-600 text-center mb-3">
              This test will strictly open on Sunday,{" "}
              <strong>{formatTestDate(test.date)}</strong>{" "}
              from <strong>10:00 AM – 10:00 PM</strong>
            </p>
            <CountdownTimer targetDate={targetDate} />
          </div>
        ) : null}

        <button
          onClick={onExpandSyllabus}
          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <FileText className="w-4 h-4" />
          {isSyllabusOpen ? "Hide Syllabus" : "View Syllabus Breakdown"}
        </button>

        {isSyllabusOpen && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm animate-fade-in">
            <p>
              <strong className="text-navy-900">Biology:</strong>{" "}
              {test.syllabus.biology}
            </p>
            <p>
              <strong className="text-navy-900">Chemistry:</strong>{" "}
              {test.syllabus.chemistry}
            </p>
            <p>
              <strong className="text-navy-900">Physics:</strong>{" "}
              {test.syllabus.physics}
            </p>
            <p>
              <strong className="text-navy-900">English & LR:</strong>{" "}
              {test.syllabus.english}
            </p>
          </div>
        )}

        <div className="pt-2">
          {isPhysical ? (
            <Button variant="secondary" disabled className="w-full">
              <Lock className="w-4 h-4" />
              Registration Opening Soon
            </Button>
          ) : isCompleted ? (
            <div className="flex gap-2">
              <Link href={`/results/${test.id}`} className="flex-1">
                <Button variant="secondary" className="w-full">
                  <CheckCircle className="w-4 h-4" />
                  View Results
                </Button>
              </Link>
              <Button variant="outline" disabled className="flex-1">
                <Lock className="w-4 h-4" />
                Locked
              </Button>
            </div>
          ) : isInProgress ? (
            <Link href={`/exam/${test.id}`}>
              <Button className="w-full">
                <Play className="w-4 h-4" />
                Resume Test
              </Button>
            </Link>
          ) : isOpen ? (
            <Link href={`/exam/${test.id}`}>
              <Button className="w-full">
                <Play className="w-4 h-4" />
                Start Test
              </Button>
            </Link>
          ) : isExpiredToday ? (
            <Button variant="outline" disabled className="w-full">
              <TimerOff className="w-4 h-4" />
              Time Out
            </Button>
          ) : (
            <Button variant="outline" disabled className="w-full">
              <Lock className="w-4 h-4" />
              Not Available Yet
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
