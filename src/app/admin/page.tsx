"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  FileText,
  Settings as SettingsIcon,
  KeyRound,
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
  hasPassword: boolean;
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
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [resettingRoll, setResettingRoll] = useState<string | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    rollNumber: string;
    password: string;
  } | null>(null);

  const [tab, setTab] = useState<"students" | "questions" | "attempts" | "certificates" | "physical" | "papers" | "settings">("students");
  const [qTestNumber, setQTestNumber] = useState(2);
  const [qJson, setQJson] = useState("");
  const [qSavedCount, setQSavedCount] = useState<number | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [qSaving, setQSaving] = useState(false);
  const [qError, setQError] = useState("");
  const [qSuccess, setQSuccess] = useState("");

  const [papers, setPapers] = useState<
    { testNumber: number; label: string; fileName: string; uploadedAt: string }[]
  >([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [pTestNumber, setPTestNumber] = useState(3);
  const [pLabel, setPLabel] = useState("Question Paper + Answer Key");
  const [pFile, setPFile] = useState<File | null>(null);
  const [pUploading, setPUploading] = useState(false);
  const [pDeletingTestNumber, setPDeletingTestNumber] = useState<number | null>(null);
  const [pError, setPError] = useState("");
  const [pSuccess, setPSuccess] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const [attemptsSummary, setAttemptsSummary] = useState<
    { testId: string; testTitle: string; testDate: string; started: number; submitted: number; inProgress: number }[]
  >([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState("");

  const [stragglers, setStragglers] = useState<
    { rollNumber: string; name: string; city: string; testId: string; testTitle: string; startedAt: string }[]
  >([]);
  const [loadingStragglers, setLoadingStragglers] = useState(false);
  const [submittingStragglers, setSubmittingStragglers] = useState(false);
  const [stragglerMessage, setStragglerMessage] = useState("");

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
    const entryTest = TESTS.find((t) => t.id === entry.testId);
    const pngUrl = await renderCertificatePng(
      {
        studentName: entry.name,
        rollNumber: entry.rollNumber,
        testTitle: entry.testTitle,
        rank: entry.rank,
        score: entry.score,
        percentage: entry.percentage,
        testDate: entryTest?.date ?? "",
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

  const loadStragglers = useCallback(async () => {
    setLoadingStragglers(true);
    setStragglerMessage("");
    const res = await fetch("/api/admin/auto-submit-stragglers", { cache: "no-store" });
    if (res.status === 401) {
      setIsAuthed(false);
      setLoadingStragglers(false);
      return;
    }
    const data = await res.json();
    setStragglers(data.stragglers ?? []);
    setLoadingStragglers(false);
  }, []);

  const handleAutoSubmitStragglers = async () => {
    if (stragglers.length === 0) return;
    const ok = window.confirm(
      `${stragglers.length} student(s) ko unke abhi tak save kiye gaye answers ke sath auto-submit kar diya jayega, aur wo merit list me show hone lagenge. Continue karein?`
    );
    if (!ok) return;

    setSubmittingStragglers(true);
    setStragglerMessage("");
    const res = await fetch("/api/admin/auto-submit-stragglers", { method: "POST" });
    if (res.status === 401) {
      setIsAuthed(false);
      setSubmittingStragglers(false);
      return;
    }
    const data = await res.json();
    if (data.errors?.length) {
      setStragglerMessage(
        `${data.count} student(s) auto-submit ho gaye. ${data.errors.length} me error aya (console check karo).`
      );
      console.error("Auto-submit stragglers errors:", data.errors);
    } else {
      setStragglerMessage(`${data.count} student(s) auto-submit ho gaye — ab merit list me show honge.`);
    }
    setSubmittingStragglers(false);
    loadStragglers();
    loadAttemptsSummary();
  };

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

  const handleResetPassword = async (rollNumber: string, name: string) => {
    const confirmed = window.confirm(
      `Reset the password for ${name} (${rollNumber})? Their old password (if any) will stop working, and a new temporary one will be generated for you to share with them.`
    );
    if (!confirmed) return;

    setResettingRoll(rollNumber);
    const res = await fetch("/api/admin/students/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber }),
    });
    const data = await res.json().catch(() => ({}));
    setResettingRoll(null);

    if (res.ok) {
      setResetPasswordResult({ rollNumber, password: data.password });
      setStudents((prev) =>
        prev.map((s) => (s.rollNumber === rollNumber ? { ...s, hasPassword: true } : s))
      );
    } else {
      alert(data.error ?? "Failed to reset password");
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

  const loadPapers = useCallback(async () => {
    setLoadingPapers(true);
    const res = await fetch("/api/admin/test-documents");
    const data = await res.json();
    setPapers(data.documents ?? []);
    setLoadingPapers(false);
  }, []);

  useEffect(() => {
    if (tab === "papers" && isAuthed) {
      loadPapers();
    }
  }, [tab, isAuthed, loadPapers]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the "data:application/pdf;base64," prefix.
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = () => reject(new Error("Could not read the file"));
      reader.readAsDataURL(file);
    });

  const handleUploadPaper = async () => {
    setPError("");
    setPSuccess("");

    if (!pFile) {
      setPError("Choose a PDF file first.");
      return;
    }
    if (pFile.type !== "application/pdf" && !pFile.name.toLowerCase().endsWith(".pdf")) {
      setPError("Only PDF files are allowed.");
      return;
    }
    if (!pLabel.trim()) {
      setPError("Give the paper a label, e.g. \"Question Paper + Answer Key\".");
      return;
    }

    setPUploading(true);
    try {
      const pdfBase64 = await fileToBase64(pFile);
      const res = await fetch("/api/admin/test-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testNumber: pTestNumber,
          label: pLabel.trim(),
          fileName: pFile.name,
          pdfBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPError(data.error ?? "Failed to upload PDF.");
        setPUploading(false);
        return;
      }
      setPSuccess(
        `Uploaded! Test ${pTestNumber}'s paper is now showing on every student's dashboard.`
      );
      setPFile(null);
      await loadPapers();
    } catch {
      setPError("Something went wrong reading that file. Try again.");
    }
    setPUploading(false);
  };

  const handleDeletePaper = async (testNumber: number) => {
    if (!confirm(`Remove the uploaded paper for Test ${testNumber}? Students will no longer see it.`)) {
      return;
    }
    setPDeletingTestNumber(testNumber);
    const res = await fetch(`/api/admin/test-documents?testNumber=${testNumber}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await loadPapers();
    } else {
      alert("Failed to delete.");
    }
    setPDeletingTestNumber(null);
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");

    if (!currentPw || !newPw || !confirmPw) {
      setPwError("Fill in all three fields.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New password and confirmation don't match.");
      return;
    }

    setChangingPw(true);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setChangingPw(false);

    if (!res.ok) {
      setPwError(data.error ?? "Failed to change password.");
      return;
    }

    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwSuccess("Password updated. Use the new password next time you log in.");
  };

  useEffect(() => {
    if (tab === "attempts" && isAuthed) {
      loadAttemptsSummary();
      loadStragglers();
    }
  }, [tab, isAuthed, loadAttemptsSummary, loadStragglers]);

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

  // Groups students who are almost certainly the same person enrolled more
  // than once: matching email, matching WhatsApp number, or matching
  // name + city. Within each group, the earliest enrollment (by createdAt)
  // is treated as the "original" and kept; every later entry in that group
  // is flagged as a duplicate to remove. Union-find so that duplicates
  // chain correctly (e.g. A matches B on email, B matches C on WhatsApp —
  // A, B, and C all end up in one group).
  const duplicateRollNumbers = useMemo(() => {
    const parent = new Map<string, string>(students.map((s) => [s.rollNumber, s.rollNumber]));
    const find = (x: string): string => {
      while (parent.get(x) !== x) {
        parent.set(x, parent.get(parent.get(x) as string) as string);
        x = parent.get(x) as string;
      }
      return x;
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

    for (let i = 0; i < students.length; i++) {
      for (let j = i + 1; j < students.length; j++) {
        const a = students[i];
        const b = students[j];
        const emailA = a.email.trim().toLowerCase();
        const emailB = b.email.trim().toLowerCase();
        const emailMatch = !!emailA && emailA === emailB;
        const whatsappMatch = !!a.whatsapp && a.whatsapp === b.whatsapp;
        const nameCityMatch =
          a.name.trim().toLowerCase() === b.name.trim().toLowerCase() &&
          a.city.trim().toLowerCase() === b.city.trim().toLowerCase();
        if (emailMatch || whatsappMatch || nameCityMatch) {
          union(a.rollNumber, b.rollNumber);
        }
      }
    }

    const groups = new Map<string, AdminStudent[]>();
    for (const s of students) {
      const root = find(s.rollNumber);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(s);
    }

    const toRemove = new Set<string>();
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const sorted = [...group].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      for (const dup of sorted.slice(1)) toRemove.add(dup.rollNumber);
    }
    return toRemove;
  }, [students]);

  const handleRemoveDuplicates = async () => {
    const rollNumbers = Array.from(duplicateRollNumbers);
    if (rollNumbers.length === 0) return;

    const names = rollNumbers
      .map((r) => students.find((s) => s.rollNumber === r)?.name ?? r)
      .join(", ");
    const confirmed = window.confirm(
      `Remove ${rollNumbers.length} duplicate enrollment(s)? The earliest enrollment for each person is kept; these later duplicates will be deleted along with their test attempts:\n\n${names}\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setRemovingDuplicates(true);
    for (const rollNumber of rollNumbers) {
      const res = await fetch("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber }),
      });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.rollNumber !== rollNumber));
      }
    }
    setRemovingDuplicates(false);
  };

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
        <button
          onClick={() => setTab("papers")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "papers"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Test Papers
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "settings"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <SettingsIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Settings
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
          {duplicateRollNumbers.size > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                <strong>{duplicateRollNumbers.size}</strong> duplicate enrollment
                {duplicateRollNumbers.size > 1 ? "s" : ""} found (same name, email, or
                WhatsApp number as another entry). The earliest enrollment for each
                person is kept.
              </p>
              <button
                onClick={handleRemoveDuplicates}
                disabled={removingDuplicates}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {removingDuplicates ? "Removing..." : "Remove Duplicates"}
              </button>
            </div>
          )}
          {resetPasswordResult && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-800">
                New password for <strong>{resetPasswordResult.rollNumber}</strong>:{" "}
                <span className="font-mono font-bold">{resetPasswordResult.password}</span>{" "}
                — share this with the student directly.
              </p>
              <button
                onClick={() => setResetPasswordResult(null)}
                className="text-xs text-emerald-700 hover:underline whitespace-nowrap"
              >
                Dismiss
              </button>
            </div>
          )}
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
                  <th className="pb-3 pr-4 font-medium">Password</th>
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
                    <td className="py-3 pr-4 font-medium">
                      {s.name}
                      {duplicateRollNumbers.has(s.rollNumber) && (
                        <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 align-middle">
                          Duplicate
                        </span>
                      )}
                    </td>
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
                    <td className="py-3 pr-4">
                      {s.hasPassword ? (
                        <Badge variant="success">Set</Badge>
                      ) : (
                        <Badge variant="warning">Not set</Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell text-slate-500 text-xs">
                      {new Date(s.createdAt).toLocaleDateString("en-PK")}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResetPassword(s.rollNumber, s.name)}
                          disabled={resettingRoll === s.rollNumber}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          {resettingRoll === s.rollNumber ? "Resetting..." : "Reset PW"}
                        </button>
                        <button
                          onClick={() => handleDelete(s.rollNumber, s.name)}
                          disabled={deletingRoll === s.rollNumber}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingRoll === s.rollNumber ? "Deleting..." : "Delete"}
                        </button>
                      </div>
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

      {tab === "papers" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-display font-bold text-lg text-navy-900">
                Upload a Test Paper
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Once a test is conducted (e.g. Sunday), upload its question
                paper / answer key PDF here. It appears on every student&apos;s
                dashboard immediately — no code changes or deployment needed.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Test
                  </label>
                  <select
                    value={pTestNumber}
                    onChange={(e) => setPTestNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        Test {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Label (shown to students)
                  </label>
                  <Input
                    value={pLabel}
                    onChange={(e) => setPLabel(e.target.value)}
                    placeholder="Question Paper + Answer Key"
                  />
                </div>
              </div>

              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                PDF file (max 3 MB)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-200 rounded-xl px-3 py-2"
              />

              {pError && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mt-3">
                  {pError}
                </p>
              )}
              {pSuccess && (
                <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg mt-3">
                  {pSuccess}
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <Button onClick={handleUploadPaper} disabled={pUploading}>
                  <Save className="w-4 h-4" />
                  {pUploading ? "Uploading..." : "Upload & Publish"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-navy-900">
                  Uploaded Papers
                </h2>
                <Button variant="outline" size="sm" onClick={loadPapers} disabled={loadingPapers}>
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPapers ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : papers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No papers uploaded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {papers.map((doc) => (
                    <div
                      key={doc.testNumber}
                      className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900 text-sm">
                          Test {doc.testNumber} — {doc.label}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {doc.fileName} · uploaded{" "}
                          {new Date(doc.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/api/test-documents/${doc.testNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-emerald-700 hover:underline"
                        >
                          View
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePaper(doc.testNumber)}
                          disabled={pDeletingTestNumber === doc.testNumber}
                        >
                          {pDeletingTestNumber === doc.testNumber ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "settings" && (
        <Card>
          <CardHeader>
            <h2 className="font-display font-bold text-lg text-navy-900">
              <KeyRound className="w-5 h-5 inline mr-2 -mt-1 text-emerald-600" />
              Change Admin Password
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Update the password used to log into this admin panel — no
              coding or deployment needed.
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Current password
                </label>
                <Input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  New password
                </label>
                <Input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Confirm new password
                </label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {pwError && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  {pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                  {pwSuccess}
                </p>
              )}

              <Button onClick={handleChangePassword} disabled={changingPw}>
                <KeyRound className="w-4 h-4" />
                {changingPw ? "Updating..." : "Update Password"}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <strong>Password bhool jao to?</strong> Vercel project&apos;s
                Environment Variables mein jo <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">ADMIN_PASSWORD</code>{" "}
                set hai, wo hamesha login ke liye kaam karega — chahe upar se
                jitni baar bhi password change karo. Wahi apna permanent
                recovery key samjho, kisi safe jagah save karke rakho.
              </p>
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

      {tab === "attempts" && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-lg text-navy-900">
                  Stuck &quot;In Progress&quot; Students
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Ye woh students hain jinhon ne test start kiya lekin submit
                  nahi kiya, aur us test ki 10 PM window band ho chuki hai —
                  isi liye ye merit list me show nahi ho rahe. Neeche list
                  check karo (kaun hai), phir auto-submit kar do — jo answers
                  unhon ne save kiye the unhi se score ban jayega aur wo turant
                  merit list me aa jayenge.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStragglers}
                  disabled={loadingStragglers}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={handleAutoSubmitStragglers}
                  disabled={submittingStragglers || stragglers.length === 0}
                >
                  <Check className="w-4 h-4" />
                  {submittingStragglers
                    ? "Submitting..."
                    : `Auto-Submit All (${stragglers.length})`}
                </Button>
              </div>
            </div>
            {stragglerMessage && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-3">
                {stragglerMessage}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {loadingStragglers ? (
              <p className="text-sm text-slate-400 py-8 text-center">Loading...</p>
            ) : stragglers.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                Koi stuck student nahi hai — sab theek hai.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-3 pr-4 font-medium">Roll Number</th>
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">City</th>
                      <th className="pb-3 pr-4 font-medium">Test</th>
                      <th className="pb-3 pr-4 font-medium">Started At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stragglers.map((s) => (
                      <tr
                        key={`${s.rollNumber}-${s.testId}`}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-3 pr-4 font-medium text-navy-900">
                          {s.rollNumber}
                        </td>
                        <td className="py-3 pr-4">{s.name}</td>
                        <td className="py-3 pr-4 text-slate-500">{s.city}</td>
                        <td className="py-3 pr-4 text-slate-500">{s.testTitle}</td>
                        <td className="py-3 pr-4 text-slate-500">
                          {s.startedAt ? new Date(s.startedAt).toLocaleString() : "—"}
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
                    <th className="pb-3 pr-4 font-medium">Mode</th>
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
                          <td className="py-3 pr-4">
                            <Badge variant={r.attendanceMode === "online" ? "default" : "success"}>
                              {r.attendanceMode === "online" ? "Online (Rs.400)" : "Physical+Online (Rs.800)"}
                            </Badge>
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
                      <td className="py-3 pr-4">
                        <Badge variant={r.attendanceMode === "online" ? "default" : "success"}>
                          {r.attendanceMode === "online" ? "Online (Rs.400)" : "Physical+Online (Rs.800)"}
                        </Badge>
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
