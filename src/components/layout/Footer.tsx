import Link from "next/link";
import Image from "next/image";
import { PLATFORM } from "@/lib/constants";
import { MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden p-1">
                <Image
                  src="/ats-logo-cropped.jpeg"
                  alt="ATS Logo"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <p className="font-display font-bold text-white text-lg">
                  {PLATFORM.name}
                </p>
                <p className="text-xs text-slate-400">{PLATFORM.fullName}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {PLATFORM.tagline}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Student Login
                </Link>
              </li>
              <li>
                <Link href="/enroll" className="hover:text-emerald-400 transition-colors">
                  New Enrollment
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/merit" className="hover:text-emerald-400 transition-colors">
                  Merit List
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact & Support</h4>
            <p className="text-sm mb-2">
              Helpline WhatsApp:{" "}
              <a
                href={`https://wa.me/92${PLATFORM.helpline.slice(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline font-medium"
              >
                {PLATFORM.helpline}
              </a>
            </p>
            <a
              href={PLATFORM.whatsappGroup}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-400 hover:underline"
            >
              <MessageCircle className="w-4 h-4" />
              Join Official WhatsApp Group
            </a>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} {PLATFORM.fullName}. All rights reserved.
          </p>
          <p className="mt-1">{PLATFORM.series}</p>
        </div>
      </div>

      <div className="border-t border-slate-800 bg-navy-900/80 overflow-hidden py-2.5">
        <div className="marquee-track flex items-center gap-16 whitespace-nowrap text-xs text-emerald-400/90 font-medium">
          <span>🔧 This website is developed by Ahmar Ali Memon</span>
          <span>🔧 This website is developed by Ahmar Ali Memon</span>
          <span>🔧 This website is developed by Ahmar Ali Memon</span>
          <span>🔧 This website is developed by Ahmar Ali Memon</span>
          <span>🔧 This website is developed by Ahmar Ali Memon</span>
          <span>🔧 This website is developed by Ahmar Ali Memon</span>
          <span>🔧 This website is developed by Ahmar Ali Memon</span>
          <span>🔧 This website is developed by Ahmar Ali Memon</span>
        </div>
      </div>

      <div className="border-t border-slate-800 bg-navy-900 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-center text-xs text-slate-400">
          <span>
            Designed &amp; Developed by{" "}
            <span className="text-white font-semibold">Ahmar Ali Memon</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <a
            href="mailto:ahmaralimemon187@gmail.com"
            className="hover:text-emerald-400 transition-colors"
          >
            ahmaralimemon187@gmail.com
          </a>
          <span className="hidden sm:inline text-slate-600">|</span>
          <a
            href="https://wa.me/923456187264"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            +92 345 6187264
          </a>
        </div>
      </div>
    </footer>
  );
}
