"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Award, Download } from "lucide-react";
import { toDataUri, renderCertificatePng, CertificateData } from "@/lib/certificate";

type CertificateProps = CertificateData;

export function CertificateModal({
  studentName,
  rollNumber,
  testTitle,
  rank,
  score,
  percentage,
  onClose,
}: CertificateProps & { onClose: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [genError, setGenError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);
    setGenError(false);
    setPreviewUrl(null);

    (async () => {
      const logoDataUri = await toDataUri("/ats-logo-chip.png");
      if (cancelled) return;

      try {
        const url = await renderCertificatePng(
          { studentName, rollNumber, testTitle, rank, score, percentage },
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
  }, [studentName, rollNumber, testTitle, rank, score, percentage]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    const safeRoll = rollNumber && rollNumber.trim() ? rollNumber : `RANK-${rank}`;
    link.download = `ATS-Certificate-${safeRoll}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-gold-500" />
          <h3 className="font-display font-bold text-xl text-navy-900">
            Your Certificate
          </h3>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200 mb-6 bg-slate-50">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Certificate preview" className="w-full" />
          ) : genError ? (
            <div className="aspect-[1500/1061] flex items-center justify-center text-red-500 text-sm px-6 text-center">
              Preview generation failed. Please try closing and clicking &quot;Get Certificate&quot; again.
            </div>
          ) : (
            <div className="aspect-[1500/1061] flex items-center justify-center text-slate-400 animate-pulse">
              {generating ? "Generating certificate..." : "Preparing..."}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            className="flex-1"
            onClick={handleDownload}
            disabled={!previewUrl}
          >
            <Download className="w-4 h-4" />
            Download Certificate
          </Button>
        </div>
      </div>
    </div>
  );
}
