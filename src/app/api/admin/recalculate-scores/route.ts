import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAttempts, saveAttempt } from "@/lib/storage";
import { getQuestionsForTest, calculateScore } from "@/lib/questions";
import { getTestById } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * One-time maintenance endpoint: re-scores every stored attempt using the
 * CURRENT scoring formula (see MARKS_CORRECT/MARKS_WRONG in lib/types.ts).
 *
 * Why this is needed: an attempt's score/correct/wrong/percentage are
 * calculated once at submit time and stored as plain numbers in the
 * database -- they are not recomputed automatically if the scoring rules
 * change later. After changing the marking scheme (e.g. removing negative
 * marking), every attempt submitted under the OLD rules keeps showing its
 * OLD score until something explicitly recalculates it from the raw
 * answers. This endpoint does exactly that, for every test, in one pass.
 *
 * Safe to run multiple times -- it always recomputes from the raw answers
 * and the test's current question bank, so running it again with no
 * further rule changes is a no-op.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts = await getAttempts();
  const submitted = attempts.filter(
    (a) => a.status === "completed" || a.status === "auto_submitted"
  );

  const questionsByTest = new Map<string, Awaited<ReturnType<typeof getQuestionsForTest>>>();
  let updated = 0;
  const errors: string[] = [];

  for (const attempt of submitted) {
    try {
      const test = getTestById(attempt.testId);
      if (!test) {
        errors.push(`${attempt.rollNumber}/${attempt.testId}: test definition not found`);
        continue;
      }

      let questions = questionsByTest.get(attempt.testId);
      if (!questions) {
        questions = await getQuestionsForTest(attempt.testId, test.number);
        questionsByTest.set(attempt.testId, questions);
      }

      const result = calculateScore(attempt.answers, questions);

      await saveAttempt({
        ...attempt,
        score: result.score,
        correct: result.correct,
        wrong: result.wrong,
        unattempted: result.unattempted,
        percentage: result.percentage,
      });
      updated++;
    } catch (err) {
      errors.push(
        `${attempt.rollNumber}/${attempt.testId}: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  }

  return NextResponse.json({ updated, total: submitted.length, errors });
}
