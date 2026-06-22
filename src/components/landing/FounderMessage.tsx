import { Card, CardContent } from "@/components/ui/Card";
import { PLATFORM } from "@/lib/constants";
import { Award } from "lucide-react";

export function FounderMessage() {
  return (
    <Card className="border-l-4 border-l-gold-500">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-display font-bold text-lg">AR</span>
          </div>
          <div>
            <p className="font-display font-bold text-navy-900">
              {PLATFORM.founder.name}
            </p>
            <p className="text-sm text-emerald-600 font-medium mb-3">
              {PLATFORM.founder.title}, {PLATFORM.founder.company}
            </p>
            <blockquote className="text-slate-600 text-sm leading-relaxed italic border-l-2 border-slate-200 pl-4">
              &ldquo;Our mission at ATS is to provide MDCAT aspirants with
              exam-standard mock tests that mirror the real PMC experience.
              Practice with discipline, analyze your weaknesses, and walk into
              your entry test with confidence.&rdquo;
            </blockquote>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CertificateBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 p-6 sm:p-8 text-white shadow-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative flex flex-col sm:flex-row items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Award className="w-8 h-8" />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="font-display font-bold text-xl mb-1">
            E-Certificates for Top Performers
          </h3>
          <p className="text-white/90 text-sm">
            Top 10 performers in each mock test will receive a downloadable
            digital Merit Certificate from ATS — Ale&apos;s Testing Service.
          </p>
        </div>
      </div>
    </div>
  );
}
