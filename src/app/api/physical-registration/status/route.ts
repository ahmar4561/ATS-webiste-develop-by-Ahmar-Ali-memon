import { NextRequest, NextResponse } from "next/server";
import { getPhysicalRegistrationForStudent } from "@/lib/storage";

/**
 * Lets a logged-in student check whether they've registered (and whether
 * the admin has confirmed) for a physical test, using their roll number.
 * Used by the dashboard and exam page to decide whether to show the
 * "Register Now" flow, a "pending confirmation" message, or unlock the
 * online "Start Test" button for out-of-city students whose payment has
 * been confirmed.
 */
export async function GET(request: NextRequest) {
  const testId = request.nextUrl.searchParams.get("testId");
  const rollNumber = request.nextUrl.searchParams.get("rollNumber");

  if (!testId || !rollNumber) {
    return NextResponse.json({ error: "testId and rollNumber are required" }, { status: 400 });
  }

  const registration = await getPhysicalRegistrationForStudent(testId, rollNumber);

  if (!registration) {
    return NextResponse.json({ status: "not_registered" });
  }

  return NextResponse.json({ status: registration.status, registration });
}
