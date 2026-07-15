import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getStudents, getAttempts, deleteStudent, studentHasPassword } from "@/lib/storage";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await getStudents();
  const attempts = await getAttempts();

  const studentsWithStats = await Promise.all(
    students.map(async (s) => ({
      ...s,
      attemptCount: attempts.filter(
        (a) => a.rollNumber.toUpperCase() === s.rollNumber.toUpperCase()
      ).length,
      hasPassword: await studentHasPassword(s.rollNumber),
    }))
  );
  studentsWithStats.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({ students: studentsWithStats });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rollNumber } = body;

    if (!rollNumber) {
      return NextResponse.json({ error: "Roll number is required" }, { status: 400 });
    }

    const existed = await deleteStudent(rollNumber);
    if (!existed) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
