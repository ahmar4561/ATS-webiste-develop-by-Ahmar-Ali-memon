import { NextRequest, NextResponse } from "next/server";
import { getAttempt, getStudentAttempts } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const rollNumber = request.nextUrl.searchParams.get("rollNumber");
  const testId = request.nextUrl.searchParams.get("testId");

  if (!rollNumber) {
    return NextResponse.json({ error: "Roll number required" }, { status: 400 });
  }

  if (testId) {
    const attempt = await getAttempt(rollNumber, testId);
    return NextResponse.json({ attempt: attempt ?? null });
  }

  const attempts = await getStudentAttempts(rollNumber);
  return NextResponse.json({ attempts });
}
