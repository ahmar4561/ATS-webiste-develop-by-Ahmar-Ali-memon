import { NextRequest, NextResponse } from "next/server";
import { getStudentByRoll, verifyStudentIdentity, setStudentPassword } from "@/lib/storage";

/**
 * Lets a student set (first time) or recover (forgot password) their
 * password WITHOUT re-enrolling. Since they don't have a password yet to
 * prove who they are, identity is verified instead using the email or
 * WhatsApp number already on file for their roll number -- both of which
 * are private to that student and not shown anywhere public like the
 * merit list.
 */
export async function POST(request: NextRequest) {
  try {
    const { rollNumber, emailOrWhatsapp, newPassword } = await request.json();

    if (!rollNumber?.trim()) {
      return NextResponse.json({ error: "Roll number is required" }, { status: 400 });
    }
    if (!emailOrWhatsapp?.trim()) {
      return NextResponse.json(
        { error: "Enter the email or WhatsApp number used at enrollment" },
        { status: 400 }
      );
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const student = await getStudentByRoll(rollNumber.trim());
    if (!student) {
      return NextResponse.json(
        { error: "Roll number not found. Please enroll first." },
        { status: 404 }
      );
    }

    const identityOk = await verifyStudentIdentity(rollNumber.trim(), emailOrWhatsapp.trim());
    if (!identityOk) {
      return NextResponse.json(
        { error: "That email/WhatsApp number doesn't match our records for this roll number." },
        { status: 401 }
      );
    }

    await setStudentPassword(rollNumber.trim(), newPassword);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to set password" }, { status: 500 });
  }
}
