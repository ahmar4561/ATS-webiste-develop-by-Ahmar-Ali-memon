import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAttempts, getStudents, saveAttempt } from "@/lib/storage";
import { getQuestionsForTest, calculateScore } from "@/lib/questions";
import { getTestById, getNextSundayCountdown } from "@/lib/constants";
import { TestAttempt } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Finds students who clicked "start" on a test but never submitted, for a
 * test whose 10 PM window has already closed. These are permanently stuck
 * as "in_progress" -- they never show up in the merit list because the
 * merit list only counts "completed" / "auto_submitted" attempts.
 *
 * GET  -> lists the stragglers (roll number, name, city, test) so the admin
 *         can see exactly who they are before doing anything.
 * POST -> scores each straggler from whatever answers they had saved
 *         (autosave / save_progress already stores partial answers as they
 *         go) and marks them "auto_submitted" with reason "timeout", the
 *         same status a real timeout auto-submit would produce. After this
 *         they appear in the merit list automatically.
 *
 * Only ever touches attempts whose test window has closed, so a student
 * who is genuinely mid-test right now is never force-submitted.
 */

async function findStragglers(testId?: string) {
  const [attempts, students] = await Promise.all([getAttempts(), getStudents()]);
  const studentMap = new Map(students.map((s) => [s.rollNumber.toUpperCase(), s]));

  return attempts.filter((a) => {
    if (a.status !== "in_progress") return false;
    if (testId && a.testId !== testId) return false;

    const test = getTestById(a.testId);
    if (!test || test.mode !== "online") return false;

    const { isPast } = getNextSundayCountdown(test.date);
    return isPast;
  }).map((a) => {
    const student = studentMap.get(a.rollNumber.toUpperCase());
    const test = getTestById(a.testId);
    return {
      rollNumber: a.rollNumber,
      name: student?.name ?? "Unknown",
      city: student?.city ?? "—",
      testId: a.testId,
      testTitle: test?.title ?? a.testId,
      startedAt: a.startedAt,
    };
  });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testId = request.nextUrl.searchParams.get("testId") ?? undefined;
  const stragglers = await findStragglers(testId);
  return NextResponse.json({ stragglers, count: stragglers.length });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const testId: string | undefined = body?.testId;
  // Optional: only submit this specific list of roll numbers (from the
  // GET preview above). If omitted, every closed-window straggler is done.
  const rollNumbers: string[] | undefined = body?.rollNumbers;

  const attempts = await getAttempts();
  const stragglerKeys = new Set(
    (await findStragglers(testId)).map((s) => `${s.rollNumber.toUpperCase()}::${s.testId}`)
  );

  const targets = attempts.filter((a) => {
    const key = `${a.rollNumber.toUpperCase()}::${a.testId}`;
    if (!stragglerKeys.has(key)) return false;
    if (rollNumbers && !rollNumbers.some((r) => r.toUpperCase() === a.rollNumber.toUpperCase())) {
      return false;
    }
    return true;
  });

  const questionsByTest = new Map<string, Awaited<ReturnType<typeof getQuestionsForTest>>>();
  const submitted: string[] = [];
  const errors: string[] = [];

  for (const attempt of targets) {
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

      const updated: TestAttempt = {
        ...attempt,
        status: "auto_submitted",
        submittedAt: new Date().toISOString(),
        score: result.score,
        correct: result.correct,
        wrong: result.wrong,
        unattempted: result.unattempted,
        percentage: result.percentage,
        autoSubmitReason: "timeout",
      };

      await saveAttempt(updated);
      submitted.push(`${attempt.rollNumber}/${attempt.testId}`);
    } catch (err) {
      errors.push(
        `${attempt.rollNumber}/${attempt.testId}: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  }

  return NextResponse.json({ submitted, count: submitted.length, errors });
}
