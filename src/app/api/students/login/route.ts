import { NextRequest, NextResponse } from "next/server";
import { getStudentByRoll } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const { rollNumber } = await request.json();
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

    return NextResponse.json({ student });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
