import { NextRequest, NextResponse } from "next/server";
import { getTestById } from "@/lib/constants";
import { getQuestionsForTest } from "@/lib/questions";
import { getStudentAttempts } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const testId = request.nextUrl.searchParams.get("testId");
  const rollNumber = request.nextUrl.searchParams.get("rollNumber");
  if (!testId) {
    return NextResponse.json({ error: "testId required" }, { status: 400 });
  }

  const test = getTestById(testId);
  if (!test || test.mode === "physical") {
    return NextResponse.json({ error: "Invalid test" }, { status: 400 });
  }

  // Only reveal the correct answer + explanation once this student has
  // actually finished this test — never while a test is still in progress,
  // for them or anyone else.
  let revealAnswers = false;
  if (rollNumber) {
    const attempts = await getStudentAttempts(rollNumber);
    revealAnswers = attempts.some(
      (a) =>
        a.testId === testId &&
        (a.status === "completed" || a.status === "auto_submitted")
    );
  }

  const allQuestions = await getQuestionsForTest(testId, test.number);
  const questions = allQuestions.map((q) =>
    revealAnswers
      ? q
      : {
          id: q.id,
          subject: q.subject,
          text: q.text,
          options: q.options,
        }
  );

  return NextResponse.json({ questions, test });
}
