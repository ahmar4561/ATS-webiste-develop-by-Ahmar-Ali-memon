"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PLATFORM } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Phone, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/merit", label: "Merit List" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Header() {
  const pathname = usePathname();
  const { student, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isExam = pathname.startsWith("/exam");

  if (isExam) return null;

  return (
    <header className="sticky top-0 z-50 glass shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden p-1">
              <Image
                src="/ats-logo-cropped.jpeg"
                alt="ATS Logo"
                width={44}
                height={44}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-navy-900">
                {PLATFORM.name}
              </span>
              <span className="hidden sm:block text-xs text-slate-500">
                {PLATFORM.fullName}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:text-navy-900 hover:bg-slate-100"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={`https://wa.me/92${PLATFORM.helpline.slice(1)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>{PLATFORM.helpline}</span>
            </a>
            <Link
              href="/admin"
              title="Admin Panel"
              className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
            </Link>
            {student ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  {student.rollNumber}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Student Login</Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-fade-in">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            {!student && (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button className="w-full mt-2" size="sm">
                  Student Login
                </Button>
              </Link>
            )}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-100"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
