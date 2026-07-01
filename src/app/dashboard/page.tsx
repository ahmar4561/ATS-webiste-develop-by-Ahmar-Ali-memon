"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { TESTS, PLATFORM } from "@/lib/constants";
import { TestCard, PhysicalRegStatus } from "@/components/dashboard/TestCard";
import { PhysicalTestModal } from "@/components/landing/PhysicalTestModal";
import { AdmitCardModal } from "@/components/dashboard/AdmitCardModal";
import { CertificateBanner } from "@/components/landing/FounderMessage";
import { Button } from "@/components/ui/Button";
import { AttemptStatus, PhysicalRegistration, TestDefinition } from "@/lib/types";
import { formatTestDate } from "@/lib/constants";
import { LayoutDashboard, Trophy } from "lucide-react";

export default function DashboardPage() {
  const { student, isLoading } = useAuth();
  const router = useRouter();
  const [attempts, setAttempts] = useState<
    Record<string, { status: AttemptStatus }>
  >({});
  const [openSyllabus, setOpenSyllabus] = useState<string | null>(null);
  const [physicalStatuses, setPhysicalStatuses] = useState<
    Record<string, PhysicalRegStatus>
  >({});
  const [physicalRegistrations, setPhysicalRegistrations] = useState<
    Record<string, PhysicalRegistration>
  >({});
  const [registeringTest, setRegisteringTest] = useState<TestDefinition | null>(null);
  const [idCardTest, setIdCardTest] = useState<TestDefinition | null>(null);

  useEffect(() => {
    if (!isLoading && !student) {
      router.push("/login");
    }
  }, [student, isLoading, router]);

  useEffect(() => {
    if (!student) return;

    fetch(`/api/attempts?rollNumber=${student.rollNumber}`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, { status: AttemptStatus }> = {};
        for (const a of data.attempts ?? []) {
          map[a.testId] = { status: a.status };
        }
        setAttempts(map);
      });
  }, [student]);

  const physicalTests = TESTS.filter((t) => t.mode === "physical");

  const loadPhysicalStatuses = useCallback(async () => {
    if (!student || physicalTests.length === 0) return;
    const results = await Promise.all(
      physicalTests.map(async (t) => {
        const res = await fetch(
          `/api/physical-registration/status?testId=${t.id}&rollNumber=${student.rollNumber}`
        );
        const data = await res.json().catch(() => null);
        const status: PhysicalRegStatus = data?.status ?? "not_registered";
        const registration: PhysicalRegistration | null = data?.registration ?? null;
        return [t.id, status, registration] as const;
      })
    );
    setPhysicalStatuses(
      Object.fromEntries(results.map(([id, status]) => [id, status]))
    );
    setPhysicalRegistrations(
      Object.fromEntries(
        results
          .filter(([, , registration]) => registration)
          .map(([id, , registration]) => [id, registration as PhysicalRegistration])
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  useEffect(() => {
    loadPhysicalStatuses();
  }, [loadPhysicalStatuses]);

  if (isLoading || !student) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-1">
            <LayoutDashboard className="w-4 h-4" />
            Student Dashboard
          </div>
          <h1 className="font-display text-3xl font-bold text-navy-900">
            Welcome, {student.name}
          </h1>
          <p className="text-slate-600 mt-1">
            Roll: <strong>{student.rollNumber}</strong> · {student.city} ·{" "}
            {PLATFORM.series}
          </p>
        </div>
        <Link href="/merit">
          <Button variant="secondary">
            <Trophy className="w-4 h-4" />
            Merit List
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <CertificateBanner />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <h2 className="font-display font-bold text-lg text-navy-900 mb-4">
          Test Specifications
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-500">Total Questions</p>
            <p className="font-bold text-navy-900 text-lg">180 MCQs</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-500">Max Marks</p>
            <p className="font-bold text-navy-900 text-lg">180</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-500">Duration</p>
            <p className="font-bold text-navy-900 text-lg">3 Hours</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-500">Marking</p>
            <p className="font-bold text-navy-900 text-lg">+1 / 0 / 0</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-500">Distribution</p>
            <p className="font-bold text-navy-900 text-xs leading-relaxed">
              Bio 81 · Chem 45 · Phy 36 · Eng 9 · LR 9
            </p>
          </div>
        </div>
      </div>

      <h2 className="font-display font-bold text-xl text-navy-900 mb-6">
        Your Mock Tests
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {TESTS.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            attemptStatus={attempts[test.id]?.status ?? "not_started"}
            isSyllabusOpen={openSyllabus === test.id}
            onExpandSyllabus={() =>
              setOpenSyllabus(openSyllabus === test.id ? null : test.id)
            }
            physicalRegStatus={
              test.mode === "physical"
                ? physicalStatuses[test.id] ?? "loading"
                : undefined
            }
            onRegisterClick={
              test.mode === "physical" ? () => setRegisteringTest(test) : undefined
            }
            onDownloadIdCard={
              test.mode === "physical" && physicalStatuses[test.id] === "confirmed"
                ? () => setIdCardTest(test)
                : undefined
            }
          />
        ))}
      </div>

      {registeringTest && student && (
        <PhysicalTestModal
          test={registeringTest}
          onClose={() => setRegisteringTest(null)}
          initialValues={{
            name: student.name,
            rollNumber: student.rollNumber,
            whatsapp: student.whatsapp,
            email: student.email,
            city: student.city,
          }}
          onRegistered={loadPhysicalStatuses}
        />
      )}

      {idCardTest && student && physicalRegistrations[idCardTest.id] && (
        <AdmitCardModal
          studentName={physicalRegistrations[idCardTest.id].name}
          rollNumber={physicalRegistrations[idCardTest.id].rollNumber || student.rollNumber}
          whatsapp={physicalRegistrations[idCardTest.id].whatsapp}
          email={physicalRegistrations[idCardTest.id].email}
          city={physicalRegistrations[idCardTest.id].city}
          testTitle={idCardTest.title}
          testDateLabel={formatTestDate(idCardTest.date)}
          registrationId={physicalRegistrations[idCardTest.id].id}
          onClose={() => setIdCardTest(null)}
        />
      )}
    </div>
  );
}
