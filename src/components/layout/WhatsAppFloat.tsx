import { MessageCircle } from "lucide-react";
import { PLATFORM } from "@/lib/constants";

export function WhatsAppFloat() {
  return (
    <a
      href={PLATFORM.whatsappGroup}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105 group"
      aria-label="Join WhatsApp Group"
    >
      <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
      <span className="hidden sm:inline text-sm font-semibold max-w-[200px] leading-tight">
        Join Official WhatsApp Group
      </span>
    </a>
  );
}
