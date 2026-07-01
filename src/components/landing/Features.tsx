import { Card, CardContent } from "@/components/ui/Card";
import {
  Brain,
  BarChart3,
  Lock,
  Clock,
  Award,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "PMC-Standard MCQs",
    description:
      "180 questions per test with Biology (81), Chemistry (45), Physics (36), English (9), and Logical Reasoning (9).",
  },
  {
    icon: Clock,
    title: "3-Hour Live Timer",
    description:
      "Prominent countdown with auto-submission at 00:00:00. Manage your time like the real MDCAT.",
  },
  {
    icon: Lock,
    title: "Sunday-Only Access",
    description:
      "Tests unlock exclusively on their scheduled Sunday from 10:00 AM to 10:00 PM. Strict one-attempt policy enforced.",
  },
  {
    icon: BarChart3,
    title: "Instant Analytics",
    description:
      "Detailed score report with correct/wrong/unattempted breakdown and question-wise review.",
  },
  {
    icon: Users,
    title: "All-Pakistan Merit",
    description:
      "Dynamic rankings with tie-breaker: higher score wins; equal scores ranked by less time taken.",
  },
  {
    icon: Award,
    title: "Merit Certificates",
    description:
      "Top 10 performers receive downloadable digital merit certificates from ATS.",
  },
];

export function Features() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
            Elite Testing Experience
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Built to match the standards of premier medical entry test portals
            — secure, fair, and analytically rigorous.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} hover>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-display font-bold text-lg text-navy-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
