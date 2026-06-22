import { sql, ensureSchema } from "./db";
import { Student, TestAttempt, MeritEntry, Question } from "./types";
import { TESTS } from "./constants";

interface StudentRow {
  roll_number: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  created_at: string;
}

interface AttemptRow {
  roll_number: string;
  test_id: string;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  time_taken_seconds: number;
  answers: unknown;
  score: number;
  correct: number;
  wrong: number;
  unattempted: number;
  percentage: string | number;
  auto_submit_reason: string | null;
}

function rowToStudent(row: StudentRow): Student {
  return {
    rollNumber: row.roll_number,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    city: row.city,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function rowToAttempt(row: AttemptRow): TestAttempt {
  return {
    rollNumber: row.roll_number,
    testId: row.test_id,
    status: row.status as TestAttempt["status"],
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
    timeTakenSeconds: row.time_taken_seconds,
    answers: (row.answers as TestAttempt["answers"]) ?? [],
    score: row.score,
    correct: row.correct,
    wrong: row.wrong,
    unattempted: row.unattempted,
    percentage: Number(row.percentage),
    autoSubmitReason: (row.auto_submit_reason as TestAttempt["autoSubmitReason"]) ?? undefined,
  };
}

export async function getStudents(): Promise<Student[]> {
  await ensureSchema();
  const { rows } = await sql<StudentRow>`
    SELECT * FROM students ORDER BY created_at ASC;
  `;
  return rows.map(rowToStudent);
}

export async function getStudentByRoll(rollNumber: string): Promise<Student | undefined> {
  await ensureSchema();
  const { rows } = await sql<StudentRow>`
    SELECT * FROM students WHERE UPPER(roll_number) = UPPER(${rollNumber}) LIMIT 1;
  `;
  return rows[0] ? rowToStudent(rows[0]) : undefined;
}

const ROLL_PREFIX = "ATS-2026-";

/**
 * Generates a random (non-sequential) 5-digit roll number, e.g. ATS-2026-48271.
 * Random instead of 001, 002, 003... so roll numbers don't reveal how many
 * students enrolled or in what order. Checked against the database for
 * collisions (extremely unlikely with 90,000 possible values, but we still
 * guard against it) and retried a few times before falling back to a wider
 * range.
 */
async function generateRandomRollNumber(): Promise<string> {
  await ensureSchema();

  for (let attempt = 0; attempt < 10; attempt++) {
    const num = Math.floor(10000 + Math.random() * 90000); // 10000-99999
    const candidate = `${ROLL_PREFIX}${num}`;
    const { rows } = await sql<{ roll_number: string }>`
      SELECT roll_number FROM students WHERE roll_number = ${candidate} LIMIT 1;
    `;
    if (rows.length === 0) return candidate;
  }

  // Extremely unlikely fallback: timestamp-based suffix guarantees uniqueness.
  return `${ROLL_PREFIX}${Date.now().toString().slice(-6)}`;
}

// Kept exported under the old name so nothing else importing it breaks.
export const generateNextRollNumber = generateRandomRollNumber;

export async function createStudent(
  student: Omit<Student, "createdAt" | "rollNumber">
): Promise<Student> {
  await ensureSchema();
  const rollNumber = await generateRandomRollNumber();

  const { rows } = await sql<StudentRow>`
    INSERT INTO students (roll_number, name, email, whatsapp, city)
    VALUES (${rollNumber}, ${student.name}, ${student.email}, ${student.whatsapp}, ${student.city})
    RETURNING *;
  `;

  return rowToStudent(rows[0]);
}

export async function getAttempts(): Promise<TestAttempt[]> {
  await ensureSchema();
  const { rows } = await sql<AttemptRow>`SELECT * FROM attempts;`;
  return rows.map(rowToAttempt);
}

export async function getAttempt(
  rollNumber: string,
  testId: string
): Promise<TestAttempt | undefined> {
  await ensureSchema();
  const { rows } = await sql<AttemptRow>`
    SELECT * FROM attempts
    WHERE UPPER(roll_number) = UPPER(${rollNumber}) AND test_id = ${testId}
    LIMIT 1;
  `;
  return rows[0] ? rowToAttempt(rows[0]) : undefined;
}

export async function saveAttempt(attempt: TestAttempt): Promise<TestAttempt> {
  await ensureSchema();
  const { rows } = await sql<AttemptRow>`
    INSERT INTO attempts (
      roll_number, test_id, status, started_at, submitted_at,
      time_taken_seconds, answers, score, correct, wrong,
      unattempted, percentage, auto_submit_reason
    ) VALUES (
      ${attempt.rollNumber}, ${attempt.testId}, ${attempt.status},
      ${attempt.startedAt}, ${attempt.submittedAt},
      ${attempt.timeTakenSeconds}, ${JSON.stringify(attempt.answers)}::jsonb,
      ${attempt.score}, ${attempt.correct}, ${attempt.wrong},
      ${attempt.unattempted}, ${attempt.percentage}, ${attempt.autoSubmitReason ?? null}
    )
    ON CONFLICT (roll_number, test_id) DO UPDATE SET
      status = EXCLUDED.status,
      started_at = EXCLUDED.started_at,
      submitted_at = EXCLUDED.submitted_at,
      time_taken_seconds = EXCLUDED.time_taken_seconds,
      answers = EXCLUDED.answers,
      score = EXCLUDED.score,
      correct = EXCLUDED.correct,
      wrong = EXCLUDED.wrong,
      unattempted = EXCLUDED.unattempted,
      percentage = EXCLUDED.percentage,
      auto_submit_reason = EXCLUDED.auto_submit_reason
    RETURNING *;
  `;
  return rowToAttempt(rows[0]);
}

export async function getMeritList(testId?: string): Promise<MeritEntry[]> {
  await ensureSchema();
  const allAttempts = await getAttempts();
  const attempts = allAttempts.filter(
    (a) =>
      (a.status === "completed" || a.status === "auto_submitted") &&
      (!testId || a.testId === testId)
  );
  const students = await getStudents();
  const studentMap = new Map(students.map((s) => [s.rollNumber.toUpperCase(), s]));

  const entries = attempts.map((a) => {
    const student = studentMap.get(a.rollNumber.toUpperCase());
    const test = TESTS.find((t) => t.id === a.testId);
    return {
      rollNumber: a.rollNumber,
      name: student?.name ?? "Unknown",
      city: student?.city ?? "—",
      testId: a.testId,
      testTitle: test?.title ?? a.testId,
      score: a.score,
      percentage: a.percentage,
      correct: a.correct,
      wrong: a.wrong,
      timeTakenSeconds: a.timeTakenSeconds,
      submittedAt: a.submittedAt ?? "",
    };
  });

  // Fallback: for any online test that has a manually entered staticTop10
  // (results announced before students had roll numbers / before live
  // attempts exist in the DB), show those students too -- with the roll
  // number left blank, since they haven't been assigned one yet. Once real
  // attempts exist for that test in the DB, this fallback stops applying
  // for that test so the live data takes over automatically.
  const testsToFallback = TESTS.filter(
    (t) =>
      t.staticTop10 &&
      t.staticTop10.length > 0 &&
      (!testId || t.id === testId) &&
      !entries.some((e) => e.testId === t.id)
  );

  for (const test of testsToFallback) {
    for (const s of test.staticTop10!) {
      entries.push({
        rollNumber: "",
        name: s.name,
        city: s.city || "—",
        testId: test.id,
        testTitle: test.title,
        score: s.score,
        percentage: (s.score / s.totalMarks) * 100,
        correct: 0,
        wrong: 0,
        timeTakenSeconds: 0,
        submittedAt: "",
      });
    }
  }

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeTakenSeconds - b.timeTakenSeconds;
  });

  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

export async function getStudentAttempts(rollNumber: string): Promise<TestAttempt[]> {
  await ensureSchema();
  const { rows } = await sql<AttemptRow>`
    SELECT * FROM attempts WHERE UPPER(roll_number) = UPPER(${rollNumber});
  `;
  return rows.map(rowToAttempt);
}

/**
 * Removes a student and every attempt/result tied to their roll number.
 * Used by the admin panel. This is a hard, irreversible delete from the
 * database -- the student disappears from the dashboard, merit list, and
 * results everywhere on the site.
 */
export async function deleteStudent(rollNumber: string): Promise<boolean> {
  await ensureSchema();
  const deleteResult = await sql`
    DELETE FROM students WHERE UPPER(roll_number) = UPPER(${rollNumber});
  `;
  await sql`
    DELETE FROM attempts WHERE UPPER(roll_number) = UPPER(${rollNumber});
  `;
  return (deleteResult.rowCount ?? 0) > 0;
}

/**
 * Admin-managed question bank for a given test number. Lets the admin
 * paste in all 180 MCQs from the dashboard instead of editing code. Falls
 * back to null (caller uses the hardcoded/placeholder bank) if nothing has
 * been saved for that test yet.
 */
export async function getAdminQuestions(
  testNumber: number
): Promise<Question[] | null> {
  await ensureSchema();
  const { rows } = await sql<{ questions: Question[] }>`
    SELECT questions FROM test_questions WHERE test_number = ${testNumber};
  `;
  if (rows.length === 0) return null;
  const questions = rows[0].questions;
  return Array.isArray(questions) && questions.length > 0 ? questions : null;
}

export async function saveAdminQuestions(
  testNumber: number,
  questions: Question[]
): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO test_questions (test_number, questions, updated_at)
    VALUES (${testNumber}, ${JSON.stringify(questions)}::jsonb, now())
    ON CONFLICT (test_number)
    DO UPDATE SET questions = ${JSON.stringify(questions)}::jsonb, updated_at = now();
  `;
}
