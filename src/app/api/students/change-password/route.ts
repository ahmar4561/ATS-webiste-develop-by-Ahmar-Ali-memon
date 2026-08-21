import { NextRequest, NextResponse } from "next/server";
import { verifyStudentPassword, setStudentPassword } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const { rollNumber, currentPassword, newPassword } = await request.json();

    if (!rollNumber?.trim() || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const valid = await verifyStudentPassword(rollNumber.trim(), currentPassword);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    await setStudentPassword(rollNumber.trim(), newPassword);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
