"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { UserPlus, ArrowRight, CheckCircle2, Copy, Check } from "lucide-react";
import { PLATFORM } from "@/lib/constants";

export default function EnrollPage() {
  const { enroll, student } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [assignedRoll, setAssignedRoll] = useState<string | null>(null);
  const [duplicateRoll, setDuplicateRoll] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const WHATSAPP_REGEX = /^03[0-9]{9}$/;

  const isFakeNumber = (digits: string) => {
    // all digits identical (e.g. 03333333333)
    if (/^(\d)\1+$/.test(digits)) return true;
    // strictly ascending or descending digits (e.g. 01234567891)
    let ascending = true;
    let descending = true;
    for (let i = 1; i < digits.length; i++) {
      const diff = digits.charCodeAt(i) - digits.charCodeAt(i - 1);
      if (diff !== 1) ascending = false;
      if (diff !== -1) descending = false;
    }
    return ascending || descending;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required.";

    if (!form.email.trim()) errs.email = "Email address is required.";
    else if (!EMAIL_REGEX.test(form.email.trim()))
      errs.email = "Please enter a valid email address.";

    const digits = form.whatsapp.replace(/[^0-9]/g, "");
    if (!form.whatsapp.trim())
      errs.whatsapp = "WhatsApp number is required.";
    else if (!WHATSAPP_REGEX.test(digits) || isFakeNumber(digits))
      errs.whatsapp =
        "Enter a valid WhatsApp number (e.g. 03001234567).";

    if (!form.city.trim()) errs.city = "City is required.";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  if (student && !assignedRoll) {
    router.push("/dashboard");
    return null;
  }

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDuplicateRoll(null);
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);
    const result = await enroll(form);
    setLoading(false);

    if (result.success && result.rollNumber) {
      setAssignedRoll(result.rollNumber);
    } else if (result.duplicate && result.existingRollNumber) {
      setDuplicateRoll(result.existingRollNumber);
    } else {
      setError(result.error ?? "Enrollment failed");
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    }
  };

  const copyRoll = async () => {
    if (!assignedRoll) return;
    await navigator.clipboard.writeText(assignedRoll);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyDuplicateRoll = async () => {
    if (!duplicateRoll) return;
    await navigator.clipboard.writeText(duplicateRoll);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (duplicateRoll) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg shadow-xl">
          <CardContent className="text-center pt-8 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-9 h-9 text-amber-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">
              You&apos;re Already Enrolled
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              We found an existing enrollment matching your email, WhatsApp
              number, or name &amp; city. Each student can only enroll once
              — here is your original Roll Number.
            </p>

            <div className="bg-slate-50 border-2 border-dashed border-amber-300 rounded-xl py-5 px-4 mb-6">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                Your Roll Number
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-bold text-navy-900 tracking-wide">
                  {duplicateRoll}
                </span>
                <button
                  onClick={copyDuplicateRoll}
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                  aria-label="Copy roll number"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            <Button className="w-full" onClick={() => router.push("/login")}>
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assignedRoll) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg shadow-xl">
          <CardContent className="text-center pt-8 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">
              Enrollment Successful!
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              This is your unique Roll Number. You will need it to log in —
              please save it carefully.
            </p>

            <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-xl py-5 px-4 mb-6">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                Your Roll Number
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-bold text-navy-900 tracking-wide">
                  {assignedRoll}
                </span>
                <button
                  onClick={copyRoll}
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                  aria-label="Copy roll number"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Quick Enrollment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register for {PLATFORM.series}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Your Roll Number will be generated automatically after enrollment.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Full Name"
              placeholder="As on CNIC/B-Form"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              error={fieldErrors.name}
              required
            />
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="student@email.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={fieldErrors.email}
              required
            />
            <Input
              id="whatsapp"
              label="WhatsApp Number"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="03001234567 (11 digits)"
              value={form.whatsapp}
              onChange={(e) =>
                update("whatsapp", e.target.value.replace(/[^0-9]/g, ""))
              }
              error={fieldErrors.whatsapp}
              required
            />
            <Input
              id="city"
              label="City"
              placeholder="Your city"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              error={fieldErrors.city}
              required
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enrolling..." : "Complete Enrollment"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already enrolled?{" "}
              <Link
                href="/login"
                className="text-emerald-600 font-semibold hover:underline"
              >
                Login Here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
