import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAdminQuestions, saveAdminQuestions } from "@/lib/storage";
import { Question } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testNumber = Number(request.nextUrl.searchParams.get("testNumber"));
  if (!testNumber) {
    return NextResponse.json({ error: "testNumber required" }, { status: 400 });
  }

  const questions = await getAdminQuestions(testNumber);
  return NextResponse.json({ questions: questions ?? [] });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const testNumber = Number(body.testNumber);
    const questions = body.questions as Question[];

    if (!testNumber) {
      return NextResponse.json({ error: "testNumber required" }, { status: 400 });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "questions array required" }, { status: 400 });
    }

    // Basic shape validation so a bad paste doesn't silently break the exam.
    for (const [i, q] of questions.entries()) {
      if (
        typeof q.id !== "number" ||
        !q.subject ||
        !q.text ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctIndex !== "number" ||
        q.correctIndex < 0 ||
        q.correctIndex > 3
      ) {
        return NextResponse.json(
          { error: `Question at position ${i + 1} is missing or has invalid fields.` },
          { status: 400 }
        );
      }
    }

    await saveAdminQuestions(testNumber, questions);
    return NextResponse.json({ success: true, count: questions.length });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
