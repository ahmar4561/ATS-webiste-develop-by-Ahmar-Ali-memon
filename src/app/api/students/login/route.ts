import { NextRequest, NextResponse } from "next/server";
import {
  getStudentByRoll,
  studentHasPassword,
  verifyStudentPassword,
} from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const { rollNumber, password } = await request.json();

    if (!rollNumber?.trim()) {
      return NextResponse.json({ error: "Roll number is required" }, { status: 400 });
    }

    const student = await getStudentByRoll(rollNumber.trim());
    if (!student) {
      return NextResponse.json(
        { error: "Roll number not found. Please enroll first." },
        { status: 404 }
      );
    }

    // Students who enrolled before passwords existed on this site don't
    // have one set yet. Tell the client explicitly so it can send them to
    // the Set Password flow instead of just showing "wrong password".
    const hasPassword = await studentHasPassword(rollNumber.trim());
    if (!hasPassword) {
      return NextResponse.json(
        {
          error:
            "Your account doesn't have a password yet. Please set one first.",
          needsPasswordSetup: true,
        },
        { status: 401 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const valid = await verifyStudentPassword(rollNumber.trim(), password);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect roll number or password" }, { status: 401 });
    }

    return NextResponse.json({ student });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
