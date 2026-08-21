import { NextRequest, NextResponse } from "next/server";
import { getStudentByRoll } from "@/lib/storage";

/**
 * Used ONLY to refresh the profile of a browser that is already logged in
 * (roll number cached in localStorage from a previous password login) --
 * e.g. to pick up a name/email change made from the admin panel. This is
 * NOT a login route and must never be used to authenticate a new session:
 * it doesn't check a password, so it must not return anything beyond the
 * same profile fields the client already has cached locally.
 */
export async function POST(request: NextRequest) {
  try {
    const { rollNumber } = await request.json();
    if (!rollNumber?.trim()) {
      return NextResponse.json({ error: "Roll number is required" }, { status: 400 });
    }

    const student = await getStudentByRoll(rollNumber.trim());
    if (!student) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch {
    return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 });
  }
}
