"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ArrowRight, KeyRound, CheckCircle2 } from "lucide-react";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rollNumber, setRollNumber] = useState(searchParams.get("rollNumber") ?? "");
  const [emailOrWhatsapp, setEmailOrWhatsapp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!rollNumber.trim() || !emailOrWhatsapp.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/students/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollNumber: rollNumber.trim(),
        emailOrWhatsapp: emailOrWhatsapp.trim(),
        newPassword,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to set password");
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="text-center pt-8 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">
              Password Set!
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              You can now log in with your Roll Number and new password.
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Set / Recover Password
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enrolled before and never got a password, or forgot it? Confirm
            your identity below to set a new one.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="rollNumber"
              label="Roll Number"
              placeholder="e.g. ATS-2026-48271"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              required
            />
            <Input
              id="emailOrWhatsapp"
              label="Email or WhatsApp number used at enrollment"
              placeholder="student@email.com or 03001234567"
              value={emailOrWhatsapp}
              onChange={(e) => setEmailOrWhatsapp(e.target.value)}
              required
            />
            <Input
              id="newPassword"
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Set Password"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Remembered your password?{" "}
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                Login Here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}
