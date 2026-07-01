"use client";

import { useState, useRef } from "react";
import { X, Banknote, Smartphone, MapPin, Calendar, CheckCircle2, Building2, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatTestDate, PHYSICAL_TEST_PAYMENT, PLATFORM } from "@/lib/constants";
import { TestDefinition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PhysicalTestModalProps {
  test: TestDefinition;
  onClose: () => void;
  /** Optional prefill for logged-in students registering from the dashboard. */
  initialValues?: {
    name?: string;
    rollNumber?: string;
    whatsapp?: string;
    email?: string;
    city?: string;
  };
  /** Called once the registration is submitted successfully. */
  onRegistered?: () => void;
}

type PaymentMethodId = "bank" | "easypaisa" | "jazzcash";

const METHOD_ICONS: Record<PaymentMethodId, typeof Banknote> = {
  bank: Building2,
  easypaisa: Smartphone,
  jazzcash: Smartphone,
};

export function PhysicalTestModal({ test, onClose, initialValues, onRegistered }: PhysicalTestModalProps) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? "",
    rollNumber: initialValues?.rollNumber ?? "",
    whatsapp: initialValues?.whatsapp ?? "",
    email: initialValues?.email ?? "",
    city: initialValues?.city ?? "",
    outOfCity: false,
  });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptMime, setReceiptMime] = useState<string>("image/jpeg");
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name);
    setReceiptMime(file.type || "image/jpeg");
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.receipt;
      return next;
    });
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (data:image/...;base64,)
      const base64 = result.split(",")[1];
      setReceiptBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.rollNumber.trim()) errs.rollNumber = "Roll Number is required.";
    const digits = form.whatsapp.replace(/[^0-9]/g, "");
    if (!/^03[0-9]{9}$/.test(digits)) {
      errs.whatsapp = "Enter a valid WhatsApp number (e.g. 03001234567).";
    }
    if (!form.city.trim()) errs.city = "City is required.";
    if (!selectedMethod) errs.paymentMethod = "Please select a payment method.";
    if (!receiptBase64) errs.receipt = "Please upload your payment receipt screenshot.";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/physical-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: test.id,
          name: form.name.trim(),
          rollNumber: form.rollNumber.trim() || null,
          whatsapp: digits,
          email: form.email.trim() || null,
          city: form.city.trim(),
          outOfCity: form.outOfCity,
          paymentMethod: selectedMethod,
          receiptBase64,
          receiptMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      onRegistered?.();
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setSubmitting(false);
  };

  const dateLabel = PHYSICAL_TEST_PAYMENT.dateConfirmed
    ? formatTestDate(test.date)
    : "Coming Soon";
  const venueLabel = PHYSICAL_TEST_PAYMENT.venueConfirmed && PHYSICAL_TEST_PAYMENT.venue
    ? PHYSICAL_TEST_PAYMENT.venue
    : "Coming Soon";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-900 px-6 py-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-widest text-gold-500 uppercase">
              Physical Mock Test
            </span>
          </div>
          <h3 className="font-display font-bold text-xl">{test.title}</h3>
        </div>

        <div className="overflow-y-auto flex-1">
          {submitted ? (
            <div className="px-6 py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h4 className="font-display text-xl font-bold text-navy-900 mb-2">
                Registration Received!
              </h4>
              <p className="text-sm text-slate-500 mb-3">
                Your registration and payment receipt have been submitted successfully.
              </p>
              {form.email.trim() && (
                <p className="text-sm text-emerald-600 font-medium mb-4">
                  📧 A confirmation email has been sent to <strong>{form.email.trim()}</strong>.
                  You will receive another email once your seat is confirmed.
                </p>
              )}
              <p className="text-xs text-slate-400 mb-6">
                You can also join our WhatsApp group for updates and venue announcements.
              </p>
              <a
                href={PLATFORM.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full">Open WhatsApp Group</Button>
              </a>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-5">
              {/* Date & Venue */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Date</span>
                  </div>
                  <p
                    className={cn(
                      "font-semibold",
                      PHYSICAL_TEST_PAYMENT.dateConfirmed ? "text-navy-900" : "text-gold-600"
                    )}
                  >
                    {dateLabel}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Venue</span>
                  </div>
                  <p
                    className={cn(
                      "font-semibold",
                      PHYSICAL_TEST_PAYMENT.venueConfirmed ? "text-navy-900" : "text-gold-600"
                    )}
                  >
                    {venueLabel}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Venue will be announced soon on our WhatsApp group. Register and pay now
                to secure your seat — especially recommended if you&apos;re coming from{" "}
                <strong>out of city</strong>.
              </p>
              <p className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                Can&apos;t make it in person? Once your registration and payment are
                confirmed by our team, a <strong>Start Test</strong> button unlocks on
                your dashboard so you can take this test online instead, during the
                same Sunday 10:00 AM – 10:00 PM window.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="pt-name"
                  label="Full Name"
                  placeholder="As on CNIC/B-Form"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  error={fieldErrors.name}
                  required
                />
                <Input
                  id="pt-roll"
                  label="Roll Number"
                  placeholder="ATS-2026-XXXXX"
                  value={form.rollNumber}
                  onChange={(e) => update("rollNumber", e.target.value)}
                  error={fieldErrors.rollNumber}
                  required
                />
                <Input
                  id="pt-whatsapp"
                  label="WhatsApp Number"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="03001234567"
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value.replace(/[^0-9]/g, ""))}
                  error={fieldErrors.whatsapp}
                  required
                />
                <Input
                  id="pt-email"
                  label="Email Address (for confirmation email)"
                  type="email"
                  placeholder="yourname@email.com (optional but recommended)"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  error={fieldErrors.email}
                />
                <Input
                  id="pt-city"
                  label="City"
                  placeholder="Your city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  error={fieldErrors.city}
                  required
                />

                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.outOfCity}
                    onChange={(e) => update("outOfCity", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/40"
                  />
                  I&apos;m coming from out of city
                </label>

                {/* Payment methods */}
                <div>
                  <p className="text-sm font-medium text-navy-800 mb-2">
                    Pay via
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {PHYSICAL_TEST_PAYMENT.methods.map((m) => {
                      const Icon = METHOD_ICONS[m.id as PaymentMethodId] ?? Banknote;
                      const active = selectedMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethod(m.id as PaymentMethodId)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-colors",
                            active
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.paymentMethod && (
                    <p className="text-sm text-red-500 mt-1.5">{fieldErrors.paymentMethod}</p>
                  )}
                </div>

                {/* Selected method details */}
                {selectedMethod && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                    {(() => {
                      const m = PHYSICAL_TEST_PAYMENT.methods.find((x) => x.id === selectedMethod)!;
                      const hasDetails = m.accountNumber && m.accountNumber.trim();
                      if (!hasDetails) {
                        return (
                          <p className="text-gold-600 font-medium">
                            {m.label} details coming soon — please check
                            back shortly or ask on WhatsApp.
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-1">
                          <p className="text-slate-500 text-xs uppercase tracking-wide">
                            {m.label} Details
                          </p>
                          {m.accountTitle && (
                            <p>
                              <span className="text-slate-500">Account Name: </span>
                              <span className="font-semibold text-navy-900">{m.accountTitle}</span>
                            </p>
                          )}
                          <p>
                            <span className="text-slate-500">Account Number: </span>
                            <span className="font-mono font-semibold text-navy-900 select-all">{m.accountNumber}</span>
                          </p>
                          {m.bankName && (
                            <p>
                              <span className="text-slate-500">Bank: </span>
                              <span className="font-semibold text-navy-900">{m.bankName}</span>
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Receipt Upload */}
                <div>
                  <p className="text-sm font-medium text-navy-800 mb-2">
                    Upload Payment Receipt <span className="text-red-500">*</span>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition-colors",
                      receiptBase64
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : fieldErrors.receipt
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400"
                    )}
                  >
                    {receiptBase64 ? (
                      <>
                        <ImageIcon className="w-5 h-5 shrink-0" />
                        <span className="font-medium truncate">{receiptFileName ?? "Receipt uploaded"}</span>
                        <span className="ml-auto text-xs shrink-0">✅ Ready</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 shrink-0" />
                        <span>Tap to upload payment screenshot</span>
                      </>
                    )}
                  </button>
                  {fieldErrors.receipt && (
                    <p className="text-sm text-red-500 mt-1.5">{fieldErrors.receipt}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    Upload a screenshot of your bank transfer / Easypaisa / JazzCash payment. Max 5 MB.
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Registration"}
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  After submitting, you&apos;ll receive a confirmation email once your seat is verified.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
