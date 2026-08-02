import { NextRequest, NextResponse } from "next/server";
import {
  getAttempt,
  saveAttempt,
  getStudentByRoll,
  getPhysicalRegistrationForStudent,
} from "@/lib/storage";
import { getTestById, getTestWindowStatus } from "@/lib/constants";
import {
  getQuestionsForTest,
  calculateScore,
  createEmptyAnswers,
} from "@/lib/questions";
import { TestAttempt, TestAnswer, EXAM_DURATION_SECONDS, TOTAL_QUESTIONS } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, rollNumber, testId, answers, timeTakenSeconds, autoSubmitReason } = body;

    if (!rollNumber || !testId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await getStudentByRoll(rollNumber);
    if (!student) {
      return NextResponse.json(
        {
          error:
            "Your session has expired or your roll number is no longer recognized. Please log out and log in again with your roll number.",
        },
        { status: 404 }
      );
    }

    const test = getTestById(testId);
    if (!test) {
      return NextResponse.json({ error: "Invalid test" }, { status: 400 });
    }

    if (test.mode === "physical") {
      // Physical-mode tests are only available online to students whose
      // registration for this specific test has been confirmed by the
      // admin (e.g. out-of-city students taking it remotely).
      const registration = await getPhysicalRegistrationForStudent(testId, rollNumber);
      if (!registration || registration.status !== "confirmed") {
        return NextResponse.json({ error: "Not registered for this test" }, { status: 403 });
      }
    }

    const existing = await getAttempt(rollNumber, testId);

    if (action === "start") {
      if (existing && (existing.status === "completed" || existing.status === "auto_submitted")) {
        return NextResponse.json(
          { error: "Test already attempted. Re-opening is not allowed." },
          { status: 403 }
        );
      }

      if (existing?.status === "in_progress") {
        return NextResponse.json({ attempt: existing });
      }

      const windowStatus = getTestWindowStatus(test.date);
      if (windowStatus !== "open") {
        const message =
          windowStatus === "expired"
            ? "Today's testing window (10:00 AM - 10:00 PM) has closed. This test is no longer available."
            : "This test is not open yet. It opens at 10:00 AM on the scheduled Sunday.";
        return NextResponse.json({ error: message }, { status: 403 });
      }

      const testTotalQuestions = test.totalQuestions ?? TOTAL_QUESTIONS;

      const attempt: TestAttempt = {
        rollNumber: student.rollNumber,
        testId,
        status: "in_progress",
        startedAt: new Date().toISOString(),
        submittedAt: null,
        timeTakenSeconds: 0,
        answers: createEmptyAnswers(testTotalQuestions),
        score: 0,
        correct: 0,
        wrong: 0,
        unattempted: testTotalQuestions,
        percentage: 0,
      };

      await saveAttempt(attempt);
      return NextResponse.json({ attempt });
    }

    if (action === "submit") {
      if (!existing || existing.status !== "in_progress") {
        return NextResponse.json({ error: "No active attempt found" }, { status: 400 });
      }

      const questions = await getQuestionsForTest(testId, test.number);
      const finalAnswers: TestAnswer[] = answers ?? existing.answers;
      const result = calculateScore(finalAnswers, questions);

      const attempt: TestAttempt = {
        ...existing,
        status: autoSubmitReason ? "auto_submitted" : "completed",
        submittedAt: new Date().toISOString(),
        timeTakenSeconds: timeTakenSeconds ?? (test.durationSeconds ?? EXAM_DURATION_SECONDS),
        answers: finalAnswers,
        score: result.score,
        correct: result.correct,
        wrong: result.wrong,
        unattempted: result.unattempted,
        percentage: result.percentage,
        autoSubmitReason: autoSubmitReason ?? "manual",
      };

      await saveAttempt(attempt);
      return NextResponse.json({ attempt, breakdown: result.breakdown });
    }

    if (action === "save_progress") {
      if (!existing || existing.status !== "in_progress") {
        return NextResponse.json({ error: "No active attempt" }, { status: 400 });
      }

      const updated: TestAttempt = {
        ...existing,
        answers: answers ?? existing.answers,
        timeTakenSeconds: timeTakenSeconds ?? existing.timeTakenSeconds,
      };

      await saveAttempt(updated);
      return NextResponse.json({ attempt: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
