"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getTestById } from "@/lib/constants";
import { ScoreReport } from "@/components/results/ScoreReport";
import { CertificateModal } from "@/components/certificate/Certificate";
import { Question, TestAttempt, MeritEntry } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Trophy, Award } from "lucide-react";

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
      <div className="flex flex-wrap gap-3 mb-8">
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
        {meritEntry && (
          <Button size="sm" onClick={() => setShowCertificate(true)}>
            <Award className="w-4 h-4" />
            Claim Your Top {meritEntry.rank} Certificate
          </Button>
        )}
      </div>

      <ScoreReport
        attempt={attempt}
        questions={questions}
        studentName={student.name}
        testTitle={test.title}
      />

      {showCertificate && meritEntry && (
        <CertificateModal
          studentName={meritEntry.name}
          rollNumber={meritEntry.rollNumber}
          testTitle={meritEntry.testTitle}
          rank={meritEntry.rank}
          score={meritEntry.score}
          percentage={meritEntry.percentage}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
