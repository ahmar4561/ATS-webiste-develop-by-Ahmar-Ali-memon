"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IdCard, Download } from "lucide-react";
import {
  toDataUriLocal,
  renderAdmitCardPng,
  AdmitCardData,
} from "@/lib/admit-card";

type AdmitCardModalProps = AdmitCardData & { onClose: () => void };

export function AdmitCardModal({
  studentName,
  rollNumber,
  whatsapp,
  email,
  city,
  testTitle,
  testDateLabel,
  registrationId,
  venue,
  onClose,
}: AdmitCardModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [genError, setGenError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);
    setGenError(false);
    setPreviewUrl(null);

    (async () => {
      const logoDataUri = await toDataUriLocal("/ats-logo-chip.png");
      if (cancelled) return;

      try {
        const url = await renderAdmitCardPng(
          {
            studentName,
            rollNumber,
            whatsapp,
            email,
            city,
            testTitle,
            testDateLabel,
            registrationId,
            venue,
          },
          logoDataUri
        );
        if (cancelled) return;
        setPreviewUrl(url);
      } catch {
        if (cancelled) return;
        setGenError(true);
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentName, rollNumber, whatsapp, email, city, testTitle, testDateLabel, registrationId, venue]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    const safeRoll = rollNumber && rollNumber.trim() ? rollNumber : `REG-${registrationId}`;
    link.download = `ATS-Admit-Card-${safeRoll}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <IdCard className="w-6 h-6 text-gold-500 shrink-0" />
          <h3 className="font-display font-bold text-lg sm:text-xl text-navy-900">
            Your Admit Card / ID Card
          </h3>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200 mb-6 bg-slate-50">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Admit card preview" className="w-full h-auto" />
          ) : genError ? (
            <div className="aspect-[1050/650] flex items-center justify-center text-red-500 text-sm px-6 text-center">
              Preview generation failed. Please close this and try again.
            </div>
          ) : (
            <div className="aspect-[1050/650] flex items-center justify-center text-slate-400 animate-pulse text-sm px-6 text-center">
              {generating ? "Generating your admit card..." : "Preparing..."}
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Print this and bring the hard copy to the test venue — entry will be given only with this card.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1" onClick={handleDownload} disabled={!previewUrl}>
            <Download className="w-4 h-4" />
            Download Admit Card
          </Button>
        </div>
      </div>
    </div>
  );
}
