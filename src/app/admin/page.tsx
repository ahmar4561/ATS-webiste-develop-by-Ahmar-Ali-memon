"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Shield, Trash2, LogOut, RefreshCcw, Users, FileQuestion, Save, Download } from "lucide-react";

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

  const [tab, setTab] = useState<"students" | "questions">("students");
  const [qTestNumber, setQTestNumber] = useState(2);
  const [qJson, setQJson] = useState("");
  const [qSavedCount, setQSavedCount] = useState<number | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [qSaving, setQSaving] = useState(false);
  const [qError, setQError] = useState("");
  const [qSuccess, setQSuccess] = useState("");

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
    </div>
  );
}
