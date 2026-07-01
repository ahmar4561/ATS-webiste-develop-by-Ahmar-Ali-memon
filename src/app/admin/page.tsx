"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  Trash2,
  LogOut,
  RefreshCcw,
  Users,
  FileQuestion,
  Save,
  Download,
  BarChart3,
  Award,
  Loader2,
  Wallet,
  Check,
  X as XIcon,
  Pencil,
} from "lucide-react";
import { formatShortDate, TESTS } from "@/lib/constants";
import { MeritEntry, PhysicalRegistration } from "@/lib/types";
import { toDataUri, renderCertificatePng } from "@/lib/certificate";

interface AdminStudent {
  rollNumber: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  createdAt: string;
  attemptCount: number;
}

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deletingRoll, setDeletingRoll] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [tab, setTab] = useState<"students" | "questions" | "attempts" | "certificates" | "physical">("students");
  const [qTestNumber, setQTestNumber] = useState(2);
  const [qJson, setQJson] = useState("");
  const [qSavedCount, setQSavedCount] = useState<number | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [qSaving, setQSaving] = useState(false);
  const [qError, setQError] = useState("");
  const [qSuccess, setQSuccess] = useState("");

  const [attemptsSummary, setAttemptsSummary] = useState<
    { testId: string; testTitle: string; testDate: string; started: number; submitted: number; inProgress: number }[]
  >([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState("");

  const [certTestId, setCertTestId] = useState<string>(TESTS[0]?.id ?? "");
  const [top10, setTop10] = useState<MeritEntry[]>([]);
  const [loadingTop10, setLoadingTop10] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingRoll, setDownloadingRoll] = useState<string | null>(null);
  const [certError, setCertError] = useState("");

  const physicalTestId = TESTS.find((t) => t.mode === "physical")?.id;
  const [registrations, setRegistrations] = useState<PhysicalRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [updatingRegId, setUpdatingRegId] = useState<number | null>(null);
  const [deletingRegId, setDeletingRegId] = useState<number | null>(null);
  const [editingRegId, setEditingRegId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    rollNumber: "",
    whatsapp: "",
    email: "",
    city: "",
  });
  const [savingRegEdit, setSavingRegEdit] = useState(false);

  const loadRegistrations = useCallback(async () => {
    setLoadingRegistrations(true);
    const url = physicalTestId
      ? `/api/admin/physical-registrations?testId=${physicalTestId}`
      : "/api/admin/physical-registrations";
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401) {
      setIsAuthed(false);
      setLoadingRegistrations(false);
      return;
    }
    const data = await res.json();
    setRegistrations(data.registrations ?? []);
    setLoadingRegistrations(false);
  }, [physicalTestId]);

  useEffect(() => {
    if (tab === "physical" && isAuthed) {
      loadRegistrations();
    }
  }, [tab, isAuthed, loadRegistrations]);

  const handleUpdateRegStatus = async (id: number, status: "confirmed" | "rejected") => {
    setUpdatingRegId(id);
    const res = await fetch("/api/admin/physical-registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
    setUpdatingRegId(null);
  };

  const handleDeleteRegistration = async (id: number, name: string) => {
    const confirmed = window.confirm(
      `Delete the registration for ${name}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingRegId(id);
    const res = await fetch("/api/admin/physical-registrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeletingRegId(null);

    if (res.ok) {
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete registration");
    }
  };

  const startEditRegistration = (r: PhysicalRegistration) => {
    setEditingRegId(r.id);
    setEditForm({
      name: r.name,
      rollNumber: r.rollNumber ?? "",
      whatsapp: r.whatsapp,
      email: r.email ?? "",
      city: r.city,
    });
  };

  const cancelEditRegistration = () => {
    setEditingRegId(null);
  };

  const saveEditRegistration = async (id: number) => {
    setSavingRegEdit(true);
    const res = await fetch("/api/admin/physical-registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fields: editForm }),
    });
    setSavingRegEdit(false);

    if (res.ok) {
      const data = await res.json();
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? data.registration : r))
      );
      setEditingRegId(null);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to save changes");
    }
  };

  const loadTop10 = useCallback(async (testId: string) => {
    if (!testId) return;
    setLoadingTop10(true);
    setCertError("");
    const res = await fetch(`/api/admin/top10?testId=${testId}`, { cache: "no-store" });
    if (res.status === 401) {
      setIsAuthed(false);
      setLoadingTop10(false);
      return;
    }
    const data = await res.json();
    setTop10(data.top10 ?? []);
    setLoadingTop10(false);
  }, []);

  useEffect(() => {
    if (tab === "certificates" && isAuthed) {
      loadTop10(certTestId);
    }
  }, [tab, isAuthed, certTestId, loadTop10]);

  const downloadOneCertificate = async (entry: MeritEntry) => {
    const logoDataUri = await toDataUri("/ats-logo-chip.png");
    const pngUrl = await renderCertificatePng(
      {
        studentName: entry.name,
        rollNumber: entry.rollNumber,
        testTitle: entry.testTitle,
        rank: entry.rank,
        score: entry.score,
        percentage: entry.percentage,
      },
      logoDataUri
    );
    const link = document.createElement("a");
    link.href = pngUrl;
    const safeRoll = entry.rollNumber && entry.rollNumber.trim() ? entry.rollNumber : `RANK-${entry.rank}`;
    link.download = `ATS-Certificate-${safeRoll}.png`;
    link.click();
  };

  const handleDownloadOne = async (entry: MeritEntry) => {
    setDownloadingRoll(entry.rollNumber || `rank-${entry.rank}`);
    setCertError("");
    try {
      await downloadOneCertificate(entry);
    } catch {
      setCertError(`Failed to generate certificate for ${entry.name}. Please try again.`);
    }
    setDownloadingRoll(null);
  };

  const handleDownloadAll = async () => {
    if (top10.length === 0) return;
    setDownloadingAll(true);
    setCertError("");
    setDownloadProgress(0);

    for (let i = 0; i < top10.length; i++) {
      try {
        await downloadOneCertificate(top10[i]);
      } catch {
        setCertError(
          `Stopped at ${top10[i].name} (rank ${top10[i].rank}) — certificate generation failed. Already-downloaded certificates are saved; you can retry the rest individually.`
        );
        break;
      }
      setDownloadProgress(i + 1);
      // Small gap between downloads so the browser doesn't block them as
      // popup spam -- multiple rapid-fire `link.click()` downloads can
      // otherwise get silently dropped by some browsers.
      await new Promise((r) => setTimeout(r, 350));
    }

    setDownloadingAll(false);
  };

  const handleRecalculateScores = async () => {
    setRecalculating(true);
    setRecalcMessage("");
    const res = await fetch("/api/admin/recalculate-scores", { method: "POST" });
    if (res.status === 401) {
      setIsAuthed(false);
      setRecalculating(false);
      return;
    }
    const data = await res.json();
    if (data.errors?.length) {
      setRecalcMessage(
        `Updated ${data.updated} of ${data.total} attempts. ${data.errors.length} had errors (check console).`
      );
      console.error("Recalculate errors:", data.errors);
    } else {
      setRecalcMessage(`Updated ${data.updated} of ${data.total} submitted attempts.`);
    }
    setRecalculating(false);
    loadAttemptsSummary();
  };

  const loadAttemptsSummary = useCallback(async () => {
    setLoadingAttempts(true);
    const res = await fetch("/api/admin/attempts-summary", { cache: "no-store" });
    if (res.status === 401) {
      setIsAuthed(false);
      setLoadingAttempts(false);
      return;
    }
    const data = await res.json();
    setAttemptsSummary(data.summary ?? []);
    setLoadingAttempts(false);
  }, []);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    const res = await fetch("/api/admin/students");
    if (res.status === 401) {
      setIsAuthed(false);
      setLoadingStudents(false);
      return;
    }
    const data = await res.json();
    setStudents(data.students ?? []);
    setIsAuthed(true);
    setLoadingStudents(false);
  }, []);

  useEffect(() => {
    loadStudents().finally(() => setCheckingSession(false));
  }, [loadStudents]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoggingIn(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error ?? "Incorrect password");
      return;
    }
    setPassword("");
    await loadStudents();
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthed(false);
    setStudents([]);
  };

  const handleDelete = async (rollNumber: string, name: string) => {
    const confirmed = window.confirm(
      `Delete ${name} (${rollNumber})? This removes them and every test attempt of theirs everywhere — dashboard, results, and merit list. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingRoll(rollNumber);
    const res = await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber }),
    });
    setDeletingRoll(null);

    if (res.ok) {
      setStudents((prev) => prev.filter((s) => s.rollNumber !== rollNumber));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete student");
    }
  };

  const loadQuestions = useCallback(async (testNumber: number) => {
    setQLoading(true);
    setQError("");
    setQSuccess("");
    const res = await fetch(`/api/admin/questions?testNumber=${testNumber}`);
    const data = await res.json();
    const questions = data.questions ?? [];
    setQSavedCount(questions.length);
    setQJson(questions.length > 0 ? JSON.stringify(questions, null, 2) : "");
    setQLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "questions" && isAuthed) {
      loadQuestions(qTestNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, qTestNumber, isAuthed]);

  useEffect(() => {
    if (tab === "attempts" && isAuthed) {
      loadAttemptsSummary();
    }
  }, [tab, isAuthed, loadAttemptsSummary]);

  const handleSaveQuestions = async () => {
    setQError("");
    setQSuccess("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(qJson);
    } catch {
      setQError("That's not valid JSON. Check for a missing comma or bracket.");
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      setQError("Paste a JSON array of question objects, e.g. [ {...}, {...} ]");
      return;
    }

    setQSaving(true);
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testNumber: qTestNumber, questions: parsed }),
    });
    const data = await res.json();
    setQSaving(false);

    if (!res.ok) {
      setQError(data.error ?? "Failed to save questions.");
      return;
    }

    setQSavedCount(data.count);
    setQSuccess(
      `Saved ${data.count} questions for Test ${qTestNumber}. They'll be used the next time a student opens this test.`
    );
  };

  const downloadTemplate = () => {
    const template = [
      {
        id: 1,
        subject: "biology",
        text: "Your question text here",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 0,
        explanation: "Explanation shown after the test",
      },
      {
        id: 2,
        subject: "chemistry",
        text: "Your question text here",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 2,
        explanation: "Explanation shown after the test",
      },
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `test-${qTestNumber}-questions-template.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  });

  if (checkingSession) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-slate-400 animate-pulse">
        Loading admin panel...
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-navy-900">
              <Shield className="w-5 h-5" />
              <h1 className="font-display font-bold text-xl">Admin Login</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Enter the admin password to manage enrolled students.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                label="Password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={loginError}
                autoFocus
              />
              <Button type="submit" disabled={loggingIn} className="w-full">
                {loggingIn ? "Checking..." : "Log In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-3">
            <Shield className="w-4 h-4" />
            Admin Panel
          </div>
          <h1 className="font-display text-3xl font-bold text-navy-900">
            Manage Students
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadStudents}>
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setTab("students")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "students"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Students
        </button>
        <button
          onClick={() => setTab("questions")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "questions"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileQuestion className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Test Questions
        </button>
        <button
          onClick={() => setTab("attempts")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "attempts"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Attempts
        </button>
        <button
          onClick={() => setTab("certificates")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "certificates"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Award className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Certificates
        </button>
        <button
          onClick={() => setTab("physical")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "physical"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Wallet className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Physical Test
        </button>
      </div>

      {tab === "students" && (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-navy-900">
                Enrolled Students
              </h2>
              <Badge variant="info">
                <Users className="w-3 h-3 mr-1 inline" />
                {students.length}
              </Badge>
            </div>
            <input
              type="text"
              placeholder="Search name, roll no, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 w-full sm:w-72"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loadingStudents ? (
            <div className="text-center py-12 text-slate-400 animate-pulse">
              Loading students...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No students found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Roll No.</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium hidden md:table-cell">Email</th>
                  <th className="pb-3 pr-4 font-medium hidden lg:table-cell">WhatsApp</th>
                  <th className="pb-3 pr-4 font-medium hidden sm:table-cell">City</th>
                  <th className="pb-3 pr-4 font-medium">Attempts</th>
                  <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Enrolled</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.rollNumber}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono text-xs">{s.rollNumber}</td>
                    <td className="py-3 pr-4 font-medium">{s.name}</td>
                    <td className="py-3 pr-4 hidden md:table-cell text-slate-500">
                      {s.email}
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell text-slate-500">
                      {s.whatsapp}
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell text-slate-500">
                      {s.city}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={s.attemptCount > 0 ? "success" : "default"}>
                        {s.attemptCount}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell text-slate-500 text-xs">
                      {new Date(s.createdAt).toLocaleDateString("en-PK")}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(s.rollNumber, s.name)}
                        disabled={deletingRoll === s.rollNumber}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingRoll === s.rollNumber ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      )}

      {tab === "questions" && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-lg text-navy-900">
                  Test Questions
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Paste all 180 MCQs for a test here — no coding needed. They
                  go live for students immediately after saving.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 font-medium">
                  Test:
                </label>
                <select
                  value={qTestNumber}
                  onChange={(e) => setQTestNumber(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      Test {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-slate-500">
                {qLoading
                  ? "Loading..."
                  : qSavedCount !== null && qSavedCount > 0
                  ? `Currently saved: ${qSavedCount} questions for Test ${qTestNumber}.`
                  : `No admin questions saved yet for Test ${qTestNumber} — the test is using placeholder questions until you add real ones.`}
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </div>

            <p className="text-xs text-slate-500 mb-2">
              Easiest way: ask ChatGPT/Claude to &quot;write 180 MDCAT MCQs as
              a JSON array with fields id, subject (biology/chemistry/
              physics/english/logical_reasoning), text, options (4 strings),
              correctIndex (0-3), explanation&quot; — then paste the result
              below.
            </p>

            <textarea
              value={qJson}
              onChange={(e) => setQJson(e.target.value)}
              placeholder='[ { "id": 1, "subject": "biology", "text": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." } ]'
              rows={16}
              spellCheck={false}
              className="w-full font-mono text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />

            {qError && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mt-3">
                {qError}
              </p>
            )}
            {qSuccess && (
              <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg mt-3">
                {qSuccess}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={handleSaveQuestions} disabled={qSaving || qLoading}>
                <Save className="w-4 h-4" />
                {qSaving ? "Saving..." : "Save Questions"}
              </Button>
              <Button
                variant="outline"
                onClick={() => loadQuestions(qTestNumber)}
                disabled={qLoading}
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Saved
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "attempts" && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-bold text-lg text-navy-900">
                Test Attempts Overview
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecalculateScores}
                  disabled={recalculating}
                >
                  <RefreshCcw className="w-4 h-4" />
                  {recalculating ? "Recalculating..." : "Recalculate All Scores"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAttemptsSummary}
                  disabled={loadingAttempts}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              How many students started vs. fully submitted each test. This
              updates in real time -- check it after a test&apos;s 10 PM window
              closes to see the final headcount.
            </p>
            {recalcMessage && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-3">
                {recalcMessage}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {loadingAttempts ? (
              <p className="text-sm text-slate-400 py-8 text-center">Loading...</p>
            ) : attemptsSummary.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                No online tests found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-3 pr-4 font-medium">Test</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Started</th>
                      <th className="pb-3 pr-4 font-medium">Submitted</th>
                      <th className="pb-3 pr-4 font-medium">In Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attemptsSummary.map((s) => (
                      <tr
                        key={s.testId}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-3 pr-4 font-medium text-navy-900">
                          {s.testTitle}
                        </td>
                        <td className="py-3 pr-4 text-slate-500">
                          {formatShortDate(s.testDate)}
                        </td>
                        <td className="py-3 pr-4 font-semibold">{s.started}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="success">{s.submitted}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">
                          {s.inProgress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "certificates" && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-lg text-navy-900">
                  Top 10 Certificates
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Download every Top 10 certificate for a test in one click
                  — ready to share straight to the WhatsApp group.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 font-medium">
                  Test:
                </label>
                <select
                  value={certTestId}
                  onChange={(e) => setCertTestId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {TESTS.filter((t) => t.mode === "online").map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {certError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                {certError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-slate-500">
                {loadingTop10
                  ? "Loading..."
                  : top10.length === 0
                  ? "No completed attempts yet for this test."
                  : `${top10.length} student${top10.length === 1 ? "" : "s"} ready to download.`}
              </p>
              <Button
                onClick={handleDownloadAll}
                disabled={downloadingAll || loadingTop10 || top10.length === 0}
              >
                {downloadingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading {downloadProgress}/{top10.length}...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download All Top {top10.length || 10}
                  </>
                )}
              </Button>
            </div>

            {loadingTop10 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Loading...</p>
            ) : top10.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                Nothing to show yet — once students complete this test,
                their certificates will appear here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-3 pr-4 font-medium">Rank</th>
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Roll No.</th>
                      <th className="pb-3 pr-4 font-medium hidden md:table-cell">City</th>
                      <th className="pb-3 pr-4 font-medium">Score</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10.map((entry) => (
                      <tr
                        key={`${entry.rank}-${entry.rollNumber}`}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-3 pr-4 font-bold text-navy-900">#{entry.rank}</td>
                        <td className="py-3 pr-4 font-medium">{entry.name}</td>
                        <td className="py-3 pr-4 hidden sm:table-cell font-mono text-xs text-slate-500">
                          {entry.rollNumber || "—"}
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell text-slate-500">
                          {entry.city}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="success">{entry.score} marks</Badge>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleDownloadOne(entry)}
                            disabled={downloadingRoll === (entry.rollNumber || `rank-${entry.rank}`) || downloadingAll}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            {downloadingRoll === (entry.rollNumber || `rank-${entry.rank}`) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "physical" && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-lg text-navy-900">
                  Physical Test Registrations
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Students who registered and chose a payment method for
                  the physical mock test. Match their WhatsApp payment
                  proof, then mark Confirmed or Rejected here.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadRegistrations}>
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loadingRegistrations ? (
              <div className="text-center py-12 text-slate-400 animate-pulse">
                Loading registrations...
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No physical test registrations yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Roll No.</th>
                    <th className="pb-3 pr-4 font-medium">WhatsApp</th>
                    <th className="pb-3 pr-4 font-medium hidden md:table-cell">Email</th>
                    <th className="pb-3 pr-4 font-medium hidden md:table-cell">City</th>
                    <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Out of City</th>
                    <th className="pb-3 pr-4 font-medium">Method</th>
                    <th className="pb-3 pr-4 font-medium">Receipt</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => {
                    const isEditing = editingRegId === r.id;
                    return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors align-top"
                    >
                      {isEditing ? (
                        <>
                          <td className="py-2 pr-4">
                            <input
                              value={editForm.name}
                              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              className="w-full min-w-[120px] rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="py-2 pr-4 hidden sm:table-cell">
                            <input
                              value={editForm.rollNumber}
                              onChange={(e) => setEditForm((f) => ({ ...f, rollNumber: e.target.value }))}
                              className="w-full min-w-[110px] rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              value={editForm.whatsapp}
                              onChange={(e) => setEditForm((f) => ({ ...f, whatsapp: e.target.value.replace(/[^0-9]/g, "") }))}
                              className="w-full min-w-[110px] rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="py-2 pr-4 hidden md:table-cell">
                            <input
                              value={editForm.email}
                              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                              className="w-full min-w-[140px] rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 pr-4 hidden md:table-cell">
                            <input
                              value={editForm.city}
                              onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                              className="w-full min-w-[100px] rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="py-3 pr-4 hidden lg:table-cell">
                            {r.outOfCity ? (
                              <Badge variant="warning">Yes</Badge>
                            ) : (
                              <span className="text-slate-400">No</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 capitalize text-slate-700">
                            {r.paymentMethod}
                          </td>
                          <td className="py-3 pr-4">
                            {r.receiptUrl ? (
                              <a
                                href={r.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">None</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={
                                r.status === "confirmed"
                                  ? "success"
                                  : r.status === "rejected"
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => saveEditRegistration(r.id)}
                                disabled={savingRegEdit}
                                title="Save changes"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              >
                                {savingRegEdit ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={cancelEditRegistration}
                                disabled={savingRegEdit}
                                title="Cancel"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                      <td className="py-3 pr-4 font-medium">{r.name}</td>
                      <td className="py-3 pr-4 hidden sm:table-cell font-mono text-xs text-slate-500">
                        {r.rollNumber || "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{r.whatsapp}</td>
                      <td className="py-3 pr-4 hidden md:table-cell text-xs text-slate-500">
                        {r.email || "—"}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell text-slate-500">
                        {r.city}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        {r.outOfCity ? (
                          <Badge variant="warning">Yes</Badge>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 capitalize text-slate-700">
                        {r.paymentMethod}
                      </td>
                      <td className="py-3 pr-4">
                        {r.receiptUrl ? (
                          <a
                            href={r.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            r.status === "confirmed"
                              ? "success"
                              : r.status === "rejected"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, "confirmed")}
                            disabled={updatingRegId === r.id || r.status === "confirmed"}
                            title="Confirm — sends confirmation email to student"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, "rejected")}
                            disabled={updatingRegId === r.id || r.status === "rejected"}
                            title="Reject"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startEditRegistration(r)}
                            title="Edit details"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRegistration(r.id, r.name)}
                            disabled={deletingRegId === r.id}
                            title="Delete registration"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                        </>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
