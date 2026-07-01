"use client";

import Link from "next/link";
import { TestDefinition } from "@/lib/types";
import {
  formatTestDate,
  isTestDayOpen,
  getNextSundayCountdown,
  getTestWindowStatus,
  PLATFORM,
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
  Wallet,
  Hourglass,
  XCircle,
  IdCard,
} from "lucide-react";
import { AttemptStatus } from "@/lib/types";

export type PhysicalRegStatus =
  | "loading"
  | "not_registered"
  | "pending"
  | "confirmed"
  | "rejected";

interface TestCardProps {
  test: TestDefinition;
  attemptStatus?: AttemptStatus;
  onExpandSyllabus?: () => void;
  isSyllabusOpen?: boolean;
  /** Only relevant for physical-mode tests. */
  physicalRegStatus?: PhysicalRegStatus;
  onRegisterClick?: () => void;
  /** Shown once physicalRegStatus === "confirmed", lets the student download their own Admit Card / ID card. */
  onDownloadIdCard?: () => void;
}

export function TestCard({
  test,
  attemptStatus = "not_started",
  onExpandSyllabus,
  isSyllabusOpen,
  physicalRegStatus = "not_registered",
  onRegisterClick,
  onDownloadIdCard,
}: TestCardProps) {
  const isPhysical = test.mode === "physical";
  // Once the admin confirms a physical-test registration, that student gets
  // the same online "Start Test" experience as the regular online tests —
  // this is for students (e.g. out of city) who can't attend in person.
  const physicalUnlocked = isPhysical && physicalRegStatus === "confirmed";
  const behavesLikeOnline = test.mode === "online" || physicalUnlocked;

  const isOpen = behavesLikeOnline && isTestDayOpen(test.date);
  const isCompleted =
    attemptStatus === "completed" || attemptStatus === "auto_submitted";
  const isInProgress = attemptStatus === "in_progress";
  const { targetDate } = getNextSundayCountdown(test.date);
  const windowStatus = behavesLikeOnline ? getTestWindowStatus(test.date) : "locked";
  const isExpiredToday = windowStatus === "expired";

  const statusBadge = () => {
    if (isPhysical && !physicalUnlocked) {
      if (physicalRegStatus === "pending") return <Badge variant="warning">Pending Confirmation</Badge>;
      if (physicalRegStatus === "rejected") return <Badge variant="danger">Registration Rejected</Badge>;
      if (physicalRegStatus === "loading") return null;
      return <Badge variant="success">Registration Open</Badge>;
    }
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

        {isPhysical && !physicalUnlocked ? (
          physicalRegStatus === "pending" ? (
            <div className="bg-gold-50 border border-gold-100 rounded-xl p-4 text-sm text-gold-700">
              <Hourglass className="w-4 h-4 inline mr-2" />
              Your registration is pending review. We&apos;ll confirm within 24
              hours. If you registered to take this test online (e.g. out of
              city), the Start Test button unlocks here once confirmed.
            </div>
          ) : physicalRegStatus === "rejected" ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              <XCircle className="w-4 h-4 inline mr-2" />
              Your registration couldn&apos;t be confirmed. Please contact us
              on WhatsApp ({PLATFORM.helpline}) for help.
            </div>
          ) : physicalRegStatus === "loading" ? null : (
            <div className="bg-gold-50 border border-gold-100 rounded-xl p-4 text-sm text-gold-700">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Register &amp; pay to secure your seat. Can&apos;t attend in
              person (e.g. out of city)? Once confirmed, you can take this
              test online here instead.
            </div>
          )
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

        {isPhysical && physicalRegStatus === "confirmed" && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-700 flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Your seat is confirmed. Download your Admit Card / ID card below.
            </span>
            {onDownloadIdCard && (
              <Button size="sm" onClick={onDownloadIdCard}>
                <IdCard className="w-4 h-4" />
                Download ID Card
              </Button>
            )}
          </div>
        )}

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
          {isPhysical && !physicalUnlocked ? (
            physicalRegStatus === "pending" ? (
              <Button variant="secondary" disabled className="w-full">
                <Hourglass className="w-4 h-4" />
                Awaiting Confirmation
              </Button>
            ) : physicalRegStatus === "rejected" ? (
              <a
                href={`https://wa.me/${PLATFORM.helpline.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  Contact Us on WhatsApp
                </Button>
              </a>
            ) : physicalRegStatus === "loading" ? (
              <Button variant="outline" disabled className="w-full">
                Loading...
              </Button>
            ) : (
              <Button className="w-full" onClick={onRegisterClick}>
                <Wallet className="w-4 h-4" />
                Register &amp; Pay Now
              </Button>
            )
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
