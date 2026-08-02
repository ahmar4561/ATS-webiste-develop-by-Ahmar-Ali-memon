import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getStudentByRoll, setStudentPassword } from "@/lib/storage";
import { generateRandomPassword } from "@/lib/password";

/**
 * Admin-triggered password reset -- for a student who lost access to both
 * their password AND the email/WhatsApp they enrolled with (so the
 * self-service Set/Recover Password flow won't work for them). Generates
 * a fresh temporary password, saves its hash, and returns the plaintext
 * once so the admin can relay it to the student directly.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rollNumber } = await request.json();
    if (!rollNumber?.trim()) {
      return NextResponse.json({ error: "Roll number is required" }, { status: 400 });
    }

    const student = await getStudentByRoll(rollNumber.trim());
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const newPassword = generateRandomPassword();
    await setStudentPassword(rollNumber.trim(), newPassword);

    return NextResponse.json({ success: true, password: newPassword });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
