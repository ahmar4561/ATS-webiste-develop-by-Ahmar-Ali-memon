import { NextRequest, NextResponse } from "next/server";
import { getAttempts } from "@/lib/storage";
import { TESTS } from "@/lib/constants";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts = await getAttempts();

  const summary = TESTS.filter((t) => t.mode === "online").map((test) => {
    const forTest = attempts.filter((a) => a.testId === test.id);
    const started = forTest.length;
    const submitted = forTest.filter(
      (a) => a.status === "completed" || a.status === "auto_submitted"
    ).length;
    const inProgress = forTest.filter((a) => a.status === "in_progress").length;

    return {
      testId: test.id,
      testTitle: test.title,
      testDate: test.date,
      started,
      submitted,
      inProgress,
    };
  });

  return NextResponse.json({ summary });
}
