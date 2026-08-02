import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { PLATFORM } from "@/lib/constants";
import { ArrowRight, BookOpen, Shield, Timer, Trophy } from "lucide-react";

export function Hero() {
  return (
    <section className="relative gradient-hero text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-3xl animate-slide-up">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-6 overflow-hidden p-2">
            <Image
              src="/ats-logo-cropped.jpeg"
              alt="ATS Logo"
              width={80}
              height={80}
              className="object-contain w-full h-full"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {PLATFORM.series}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Pakistan&apos;s Premier{" "}
            <span className="text-gradient">MDCAT</span> Mock Testing Portal
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 mb-4 leading-relaxed">
            {PLATFORM.tagline}
          </p>
          <p className="text-slate-400 mb-8">
            180 MCQs · 3 Hours · Negative Marking · Sunday 10 AM–10 PM Live
            Tests · All-Pakistan Merit Rankings
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Enter Portal
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/enroll">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/30 text-white hover:bg-white hover:text-navy-900">
                New Enrollment
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {[
            { icon: BookOpen, label: "180 MCQs", sub: "Per Mock Test" },
            { icon: Timer, label: "3 Hours", sub: "Strict Timer" },
            { icon: Shield, label: "Anti-Cheat", sub: "Proctored Mode" },
            { icon: Trophy, label: "Merit List", sub: "All Pakistan" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <Icon className="w-6 h-6 text-emerald-400 mb-2" />
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
