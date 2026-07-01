"use client";

import { useState } from "react";
import { TESTS, formatTestDate } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Calendar, Monitor, MapPin, Wallet } from "lucide-react";
import { TestDefinition } from "@/lib/types";
import { PhysicalTestModal } from "@/components/landing/PhysicalTestModal";

export function Schedule() {
  const [registeringTest, setRegisteringTest] = useState<TestDefinition | null>(null);

  return (
    <section id="schedule-section" className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
            Mock Test Schedule 2026
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Online assessments unlock strictly on scheduled Sundays from
            10:00 AM – 10:00 PM. One attempt per student per test — no
            re-entry allowed.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTS.map((test) => (
            <Card key={test.id} hover className="relative">
              {test.mode === "physical" && (
                <div className="absolute top-0 left-0 right-0 bg-gold-500 text-white text-xs font-bold text-center py-1.5 rounded-t-2xl">
                  Registration Open — Venue Coming Soon
                </div>
              )}
              <CardHeader className={test.mode === "physical" ? "pt-10" : ""}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={test.mode === "online" ? "success" : "warning"}>
                    {test.mode === "online" ? "Online Assessment" : "Physical Mock"}
                  </Badge>
                  <span className="text-2xl font-display font-bold text-navy-900/20">
                    #{test.number}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-navy-900">
                  {test.title}
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">{formatTestDate(test.date)}</span>
                  </div>
                  {test.mode === "online" && (
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium">10:00 AM – 10:00 PM</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {test.mode === "online" ? (
                      <Monitor className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <MapPin className="w-4 h-4 text-gold-500" />
                    )}
                    <span>
                      {test.mode === "online"
                        ? "Online Assessment Mode"
                        : "On-Campus Physical Test"}
                    </span>
                  </div>
                </div>

                {test.mode === "physical" && (
                  <Button
                    className="w-full mt-4"
                    size="sm"
                    onClick={() => setRegisteringTest(test)}
                  >
                    <Wallet className="w-4 h-4" />
                    Register &amp; Pay Now
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {registeringTest && (
        <PhysicalTestModal
          test={registeringTest}
          onClose={() => setRegisteringTest(null)}
        />
      )}
    </section>
  );
}
