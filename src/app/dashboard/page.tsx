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
import { LayoutDashboard, Trophy, Download, FileDown, KeyRound, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";

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
  const [uploadedPapers, setUploadedPapers] = useState<
    { testNumber: number; label: string }[]
  >([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    fetch("/api/test-documents")
      .then((r) => r.json())
      .then((data) => setUploadedPapers(data.documents ?? []))
      .catch(() => {});
  }, []);

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

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("Please fill in all fields.");
      return;
    }
    if (newPw.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New password and confirmation don't match.");
      return;
    }
    setChangingPw(true);
    const res = await fetch("/api/students/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollNumber: student?.rollNumber,
        currentPassword: currentPw,
        newPassword: newPw,
      }),
    });
    const data = await res.json();
    setChangingPw(false);
    if (!res.ok) {
      setPwError(data.error ?? "Failed to change password.");
      return;
    }
    setPwSuccess("Password updated. Use the new password next time you log in.");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

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
        <button
          onClick={() => setShowPasswordForm((v) => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display font-bold text-lg text-navy-900">
              Change Password
            </h2>
          </div>
          <span className="text-sm text-slate-400">
            {showPasswordForm ? "Hide" : "Show"}
          </span>
        </button>

        {showPasswordForm && (
          <div className="mt-4 grid sm:grid-cols-3 gap-4 max-w-2xl">
            <Input
              id="currentPw"
              label="Current Password"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
            />
            <Input
              id="newPw"
              label="New Password"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              id="confirmPw"
              label="Confirm New Password"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
            <div className="sm:col-span-3 flex items-center gap-3">
              <Button onClick={handleChangePassword} disabled={changingPw}>
                {changingPw ? "Updating..." : "Update Password"}
              </Button>
              {pwSuccess && (
                <span className="text-sm text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> {pwSuccess}
                </span>
              )}
              {pwError && <span className="text-sm text-red-500">{pwError}</span>}
            </div>
          </div>
        )}
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

      {(() => {
        // Admin-uploaded papers (via the admin panel, stored in the DB) take
        // priority over the static pastPaperUrl in constants.ts for the same
        // test — that way uploading a new one from the admin panel always
        // wins without needing a code change.
        const uploadedByNumber = new Map(
          uploadedPapers.map((p) => [p.testNumber, p])
        );
        const combined = TESTS.filter(
          (t) => uploadedByNumber.has(t.number) || t.pastPaperUrl
        ).map((t) => {
          const uploaded = uploadedByNumber.get(t.number);
          return uploaded
            ? {
                id: t.id,
                title: t.title,
                href: `/api/test-documents/${t.number}`,
                label: uploaded.label,
              }
            : {
                id: t.id,
                title: t.title,
                href: t.pastPaperUrl!,
                label: t.pastPaperLabel ?? "Download PDF",
              };
        });

        if (combined.length === 0) return null;

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-1">
              <FileDown className="w-5 h-5 text-emerald-600" />
              <h2 className="font-display font-bold text-lg text-navy-900">
                Past Papers
              </h2>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Question papers and answer keys for every test conducted so far
              — available to every student, whether you attempted that test
              or not, and whenever you enrolled.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {combined.map((p) => (
                <a
                  key={p.id}
                  href={p.href}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div>
                    <p className="font-semibold text-navy-900 text-sm">
                      {p.title}
                    </p>
                    <p className="text-xs text-slate-500">{p.label}</p>
                  </div>
                  <Download className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition-transform shrink-0" />
                </a>
              ))}
            </div>
          </div>
        );
      })()}

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
              test.mode === "physical" &&
              physicalStatuses[test.id] === "confirmed" &&
              // ID card is only for students who paid for Physical + Online
              // (Rs. 800). Online-only (Rs. 400) students don't get one —
              // they never show up at the venue, so there's nothing to
              // scan/check them in with.
              physicalRegistrations[test.id]?.attendanceMode === "physical_plus_online"
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
