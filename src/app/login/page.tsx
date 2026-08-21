"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";
import { PLATFORM } from "@/lib/constants";

export default function LoginPage() {
  const { login, student } = useAuth();
  const router = useRouter();
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  if (student) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsPasswordSetup(false);
    setLoading(true);

    const result = await login(rollNumber, password);
    setLoading(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Login failed");
      setNeedsPasswordSetup(!!result.needsPasswordSetup);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-4 overflow-hidden p-2">
            <Image
              src="/ats-logo-cropped.jpeg"
              alt="ATS Logo"
              width={80}
              height={80}
              className="object-contain w-full h-full"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Student Login
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your Roll Number and Password to access {PLATFORM.series}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="rollNumber"
              label="Roll Number"
              placeholder="e.g. ATS-2026-48271"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              required
              autoFocus
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              required
            />

            {needsPasswordSetup && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                Your account doesn&apos;t have a password yet.{" "}
                <Link
                  href={`/set-password?rollNumber=${encodeURIComponent(rollNumber)}`}
                  className="font-semibold underline"
                >
                  Set one now
                </Link>{" "}
                — it only takes a moment.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login to Portal"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/set-password"
              className="text-sm text-slate-500 hover:text-emerald-600 hover:underline"
            >
              Forgot password / need to set one?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have a Roll Number?{" "}
              <Link
                href="/enroll"
                className="text-emerald-600 font-semibold hover:underline"
              >
                Enroll Now
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
