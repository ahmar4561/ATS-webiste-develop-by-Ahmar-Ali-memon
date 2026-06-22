import { Hero } from "@/components/landing/Hero";
import { Schedule } from "@/components/landing/Schedule";
import { Features } from "@/components/landing/Features";
import {
  FounderMessage,
  CertificateBanner,
} from "@/components/landing/FounderMessage";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MessageCircle } from "lucide-react";
import { PLATFORM } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Schedule />

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <CertificateBanner />
          <FounderMessage />

          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-navy-900">
                  Join Official WhatsApp Group
                </h3>
                <p className="text-sm text-slate-600">
                  Results, announcements &amp; updates for MDCAT Mock Series 2026
                </p>
              </div>
            </div>
            <a
              href={PLATFORM.whatsappGroup}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>Join Group</Button>
            </a>
          </div>
        </div>
      </section>

      <Features />

      <section className="py-16 gradient-hero text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Ready to Test Your MDCAT Preparation?
          </h2>
          <p className="text-slate-300 mb-8">
            Enroll in seconds, get your unique Roll Number instantly, and
            access world-class mock tests every Sunday.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Student Login
              </Button>
            </Link>
            <Link href="/merit">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white hover:text-navy-900"
              >
                View Merit List
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
