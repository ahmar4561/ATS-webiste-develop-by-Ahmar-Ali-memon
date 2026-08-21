"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getTestById, getTestWindowStatus } from "@/lib/constants";
import { ScoreReport } from "@/components/results/ScoreReport";
import { CertificateModal } from "@/components/certificate/Certificate";
import { Question, TestAttempt, MeritEntry } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Trophy, Award, FileDown } from "lucide-react";

export default function ResultsPage() {
  const params = useParams();
  const testId = params.testId as string;
  const { student, isLoading } = useAuth();
  const router = useRouter();

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [meritEntry, setMeritEntry] = useState<MeritEntry | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const test = getTestById(testId);

  // Certificates only become available once this test's 10 PM submission
  // window has actually closed -- see the matching helper on the Merit
  // List page for the full reasoning.
  const isCertEligible = (): boolean => {
    if (!test) return false;
    const status = getTestWindowStatus(test.date);
    if (status === "expired") return true;
    if (status === "locked") {
      const todayPkt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Karachi",
      }).format(new Date());
      return test.date < todayPkt;
    }
    return false;
  };

  useEffect(() => {
    if (!isLoading && !student) {
      router.push("/login");
    }
  }, [student, isLoading, router]);

  useEffect(() => {
    if (!student) return;

    async function load() {
      const [aRes, qRes, mRes] = await Promise.all([
        fetch(`/api/attempts?rollNumber=${student!.rollNumber}&testId=${testId}`),
        fetch(`/api/questions?testId=${testId}&rollNumber=${student!.rollNumber}`),
        fetch(`/api/merit?testId=${testId}`),
      ]);

      const aData = await aRes.json();
      const qData = await qRes.json();
      const mData = await mRes.json();

      if (
        !aData.attempt ||
        (aData.attempt.status !== "completed" &&
          aData.attempt.status !== "auto_submitted")
      ) {
        router.push("/dashboard");
        return;
      }

      setAttempt(aData.attempt);
      setQuestions(qData.questions);

      const ownEntry: MeritEntry | undefined = (mData.merit ?? []).find(
        (e: MeritEntry) =>
          e.rollNumber.toUpperCase() === student!.rollNumber.toUpperCase()
      );
      if (ownEntry && ownEntry.rank <= 10) {
        setMeritEntry(ownEntry);
      }

      setLoading(false);
    }

    load();
  }, [student, testId, router]);

  if (isLoading || loading || !student || !attempt || !test) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-wrap gap-3 mb-8 no-print">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/merit">
          <Button variant="secondary" size="sm">
            <Trophy className="w-4 h-4" />
            Merit List
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <FileDown className="w-4 h-4" />
          Download PDF
        </Button>
        {meritEntry && (
          isCertEligible() ? (
            <Button size="sm" onClick={() => setShowCertificate(true)}>
              <Award className="w-4 h-4" />
              Claim Your Top {meritEntry.rank} Certificate
            </Button>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500 px-3 py-2">
              <Award className="w-4 h-4" />
              Certificate available after 10 PM tonight
            </span>
          )
        )}
      </div>

      <div id="printable-result">
        <ScoreReport
          attempt={attempt}
          questions={questions}
          studentName={student.name}
          testTitle={test.title}
        />
      </div>

      {showCertificate && meritEntry && (
        <CertificateModal
          studentName={meritEntry.name}
          rollNumber={meritEntry.rollNumber}
          testTitle={meritEntry.testTitle}
          testDate={test.date}
          rank={meritEntry.rank}
          score={meritEntry.score}
          percentage={meritEntry.percentage}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
