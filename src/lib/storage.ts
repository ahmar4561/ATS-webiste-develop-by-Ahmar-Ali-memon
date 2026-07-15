import { sql, ensureSchema } from "./db";
import { Student, TestAttempt, MeritEntry, Question, PhysicalRegistration } from "./types";
import { TESTS } from "./constants";
import { hashPassword, verifyPassword, generateRandomPassword } from "./password";

interface StudentRow {
  roll_number: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  created_at: string;
  password_hash: string | null;
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

export const ROLL_PREFIX = "ATS-2026-";

// Matches the exact shape produced by generateRandomRollNumber(), e.g.
// "ATS-2026-48271". Used to reject made-up/garbage roll numbers before we
// even hit the database.
const ROLL_NUMBER_FORMAT = /^ATS-2026-\d{5}$/i;

export function isValidRollNumberFormat(rollNumber: string): boolean {
  return ROLL_NUMBER_FORMAT.test(rollNumber.trim());
}

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

/**
 * Looks for an existing student that matches this new enrollment on any of
 * the "same person" signals: same email, same WhatsApp number, or same
 * name + city combination. Comparisons are case-insensitive and trim
 * whitespace, so "Ali Khan" / "ali khan " / "ALI KHAN" are all treated as
 * the same person. Returns the first match found (the original enrollment),
 * or undefined if this looks like a genuinely new student.
 *
 * Used to block one person from enrolling multiple times under slightly
 * different details just to get extra test attempts.
 */
export async function findDuplicateStudent(
  candidate: { name: string; email: string; whatsapp: string; city: string }
): Promise<Student | undefined> {
  await ensureSchema();

  const email = candidate.email.trim().toLowerCase();
  const whatsapp = candidate.whatsapp.replace(/[^0-9]/g, "");
  const name = candidate.name.trim().toLowerCase();
  const city = candidate.city.trim().toLowerCase();

  const { rows } = await sql<StudentRow>`
    SELECT * FROM students
    WHERE LOWER(email) = ${email}
       OR whatsapp = ${whatsapp}
       OR (LOWER(name) = ${name} AND LOWER(city) = ${city})
    ORDER BY created_at ASC
    LIMIT 1;
  `;

  return rows[0] ? rowToStudent(rows[0]) : undefined;
}

/**
 * Creates a new student AND a temporary password in the same step (instead
 * of leaving the account passwordless like before). The plaintext password
 * is returned once, alongside the roll number, so the enroll page can show
 * it to the student -- only its hash is ever stored.
 */
export async function createStudent(
  student: Omit<Student, "createdAt" | "rollNumber">
): Promise<{ student: Student; password: string }> {
  await ensureSchema();
  const rollNumber = await generateRandomRollNumber();
  const password = generateRandomPassword();
  const passwordHash = hashPassword(password);

  const { rows } = await sql<StudentRow>`
    INSERT INTO students (roll_number, name, email, whatsapp, city, password_hash)
    VALUES (${rollNumber}, ${student.name}, ${student.email}, ${student.whatsapp}, ${student.city}, ${passwordHash})
    RETURNING *;
  `;

  return { student: rowToStudent(rows[0]), password };
}

/**
 * True if this student has already set a password (either from enrolling
 * after this feature shipped, or by using the Set/Recover Password flow).
 * Students enrolled before this feature has password_hash = NULL.
 */
export async function studentHasPassword(rollNumber: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ password_hash: string | null }>`
    SELECT password_hash FROM students WHERE UPPER(roll_number) = UPPER(${rollNumber}) LIMIT 1;
  `;
  return !!rows[0]?.password_hash;
}

export async function verifyStudentPassword(
  rollNumber: string,
  password: string
): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql<{ password_hash: string | null }>`
    SELECT password_hash FROM students WHERE UPPER(roll_number) = UPPER(${rollNumber}) LIMIT 1;
  `;
  const stored = rows[0]?.password_hash;
  if (!stored) return false;
  return verifyPassword(password, stored);
}

/**
 * Sets/overwrites a student's password. Used by: (1) the Set/Recover
 * Password flow -- for students who enrolled before this feature existed,
 * or who forgot their password, after verifying their email/WhatsApp on
 * file; and (2) the admin panel's "Reset Password" action.
 */
export async function setStudentPassword(
  rollNumber: string,
  newPassword: string
): Promise<boolean> {
  await ensureSchema();
  const passwordHash = hashPassword(newPassword);
  const result = await sql`
    UPDATE students SET password_hash = ${passwordHash}
    WHERE UPPER(roll_number) = UPPER(${rollNumber});
  `;
  return (result.rowCount ?? 0) > 0;
}

/**
 * Verifies that the given email or WhatsApp number matches what's on file
 * for this roll number -- used as the identity check for the Set/Recover
 * Password flow, since these students don't have a password yet to prove
 * who they are with.
 */
export async function verifyStudentIdentity(
  rollNumber: string,
  emailOrWhatsapp: string
): Promise<boolean> {
  await ensureSchema();
  const value = emailOrWhatsapp.trim().toLowerCase();
  const whatsappDigits = value.replace(/[^0-9]/g, "");
  const { rows } = await sql<{ email: string; whatsapp: string }>`
    SELECT email, whatsapp FROM students WHERE UPPER(roll_number) = UPPER(${rollNumber}) LIMIT 1;
  `;
  const row = rows[0];
  if (!row) return false;
  if (row.email.trim().toLowerCase() === value) return true;
  if (whatsappDigits && row.whatsapp === whatsappDigits) return true;
  return false;
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
    // Some older/edge-case rows can have null/undefined score, percentage
    // or timeTakenSeconds (e.g. legacy attempts predating a column). Fall
    // back to 0 for each so the merit list always has a real number to
    // display (0 / 0.0% / 00:00:00) instead of a blank cell.
    const score = Number.isFinite(a.score) ? a.score : 0;
    const percentage = Number.isFinite(a.percentage) ? a.percentage : 0;
    const timeTakenSeconds = Number.isFinite(a.timeTakenSeconds)
      ? a.timeTakenSeconds
      : 0;
    return {
      rollNumber: a.rollNumber,
      name: student?.name ?? "Unknown",
      city: student?.city ?? "—",
      testId: a.testId,
      testTitle: test?.title ?? a.testId,
      score,
      percentage,
      correct: a.correct,
      wrong: a.wrong,
      timeTakenSeconds,
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

  // De-duplicate by (test, name): if the same student shows up more than
  // once for the same test -- e.g. they accidentally enrolled twice and
  // got two different roll numbers -- only their single best attempt
  // should occupy a spot in the merit list / Top 10. Without this, one
  // real student could take two ranks (like #1 AND #9) and push a
  // different, unique student out of the Top 10 entirely. Keeping just
  // their best score (ties broken by faster completion time) means the
  // next unique-named student below automatically moves up to fill the
  // freed spot -- no other ranking rule changes.
  const bestByTestAndName = new Map<string, (typeof entries)[number]>();
  for (const e of entries) {
    const key = `${e.testId}::${e.name.trim().toLowerCase()}`;
    const existing = bestByTestAndName.get(key);
    if (
      !existing ||
      e.score > existing.score ||
      (e.score === existing.score && e.timeTakenSeconds < existing.timeTakenSeconds)
    ) {
      bestByTestAndName.set(key, e);
    }
  }
  const dedupedEntries = Array.from(bestByTestAndName.values());

  dedupedEntries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeTakenSeconds - b.timeTakenSeconds;
  });

  // Dense ranking ("1-2-2-3"): students with the exact same score share
  // the exact same rank number, instead of just numbering rows 1, 2, 3...
  // top to bottom (which gave two students with identical scores different
  // positions, e.g. #9 and #10, purely because of list order). Time-taken
  // still decides *display* order among tied students, but no longer
  // splits their rank. Unlike "standard" competition ranking, the next
  // distinct (lower) score after a tie does NOT skip ahead by the number
  // of tied students -- it simply continues at the next whole number
  // (...8, 9, 9, 10, 11, 12...) so a tie never creates a gap in the
  // Top 10 / Top N and the list keeps exactly N distinct positions filled.
  let rank = 0;
  let lastScore: number | null = null;
  return dedupedEntries.map((e) => {
    if (lastScore === null || e.score !== lastScore) {
      rank = rank + 1;
      lastScore = e.score;
    }
    return { ...e, rank };
  });
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

export interface TestDocumentMeta {
  testNumber: number;
  label: string;
  fileName: string;
  uploadedAt: string;
}

/**
 * Lightweight metadata for every uploaded test paper — used on the student
 * dashboard and the admin panel list. Deliberately excludes pdf_base64 so
 * these queries stay fast even as papers pile up.
 */
export async function getTestDocumentsMeta(): Promise<TestDocumentMeta[]> {
  await ensureSchema();
  const { rows } = await sql<{
    test_number: number;
    label: string;
    file_name: string;
    uploaded_at: string;
  }>`
    SELECT test_number, label, file_name, uploaded_at
    FROM test_documents
    ORDER BY test_number ASC;
  `;
  return rows.map((r) => ({
    testNumber: r.test_number,
    label: r.label,
    fileName: r.file_name,
    uploadedAt: new Date(r.uploaded_at).toISOString(),
  }));
}

/** Full row including the base64 PDF data — used only by the download route. */
export async function getTestDocument(
  testNumber: number
): Promise<{ label: string; fileName: string; pdfBase64: string } | null> {
  await ensureSchema();
  const { rows } = await sql<{
    label: string;
    file_name: string;
    pdf_base64: string;
  }>`
    SELECT label, file_name, pdf_base64 FROM test_documents WHERE test_number = ${testNumber};
  `;
  if (rows.length === 0) return null;
  return { label: rows[0].label, fileName: rows[0].file_name, pdfBase64: rows[0].pdf_base64 };
}

export async function saveTestDocument(input: {
  testNumber: number;
  label: string;
  fileName: string;
  pdfBase64: string;
}): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO test_documents (test_number, label, file_name, pdf_base64, uploaded_at)
    VALUES (${input.testNumber}, ${input.label}, ${input.fileName}, ${input.pdfBase64}, now())
    ON CONFLICT (test_number)
    DO UPDATE SET
      label = ${input.label},
      file_name = ${input.fileName},
      pdf_base64 = ${input.pdfBase64},
      uploaded_at = now();
  `;
}

export async function deleteTestDocument(testNumber: number): Promise<boolean> {
  await ensureSchema();
  const result = await sql`
    DELETE FROM test_documents WHERE test_number = ${testNumber};
  `;
  return (result.rowCount ?? 0) > 0;
}

export async function getAdminPasswordHash(): Promise<string | null> {
  await ensureSchema();
  const { rows } = await sql<{ password_hash: string | null }>`
    SELECT password_hash FROM admin_settings WHERE id = 1;
  `;
  return rows[0]?.password_hash ?? null;
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO admin_settings (id, password_hash, updated_at)
    VALUES (1, ${hash}, now())
    ON CONFLICT (id)
    DO UPDATE SET password_hash = ${hash}, updated_at = now();
  `;
}

interface PhysicalRegistrationRow {
  id: number;
  test_id: string;
  name: string;
  roll_number: string | null;
  whatsapp: string;
  email: string | null;
  city: string;
  out_of_city: boolean;
  attendance_mode: string;
  payment_method: string;
  receipt_url: string | null;
  status: string;
  created_at: string;
}

function rowToPhysicalRegistration(row: PhysicalRegistrationRow): PhysicalRegistration {
  return {
    id: row.id,
    testId: row.test_id,
    name: row.name,
    rollNumber: row.roll_number,
    whatsapp: row.whatsapp,
    email: row.email ?? null,
    city: row.city,
    outOfCity: row.out_of_city,
    attendanceMode: (row.attendance_mode ?? "physical_plus_online") as PhysicalRegistration["attendanceMode"],
    paymentMethod: row.payment_method as PhysicalRegistration["paymentMethod"],
    receiptUrl: row.receipt_url ?? null,
    status: row.status as PhysicalRegistration["status"],
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * Records a physical-test registration intent. The student fills this form
 * after choosing how they'll pay (bank/Easypaisa/JazzCash) and uploads a
 * payment receipt. An automatic "registration received" email is sent.
 * The admin then reviews the receipt and confirms/rejects, triggering a
 * "confirmed" confirmation email to the student.
 */
export async function createPhysicalRegistration(input: {
  testId: string;
  name: string;
  rollNumber: string | null;
  whatsapp: string;
  email: string | null;
  city: string;
  outOfCity: boolean;
  attendanceMode: string;
  paymentMethod: string;
  receiptUrl: string | null;
}): Promise<PhysicalRegistration> {
  await ensureSchema();
  const { rows } = await sql<PhysicalRegistrationRow>`
    INSERT INTO physical_registrations
      (test_id, name, roll_number, whatsapp, email, city, out_of_city, attendance_mode, payment_method, receipt_url)
    VALUES (
      ${input.testId}, ${input.name}, ${input.rollNumber}, ${input.whatsapp},
      ${input.email}, ${input.city}, ${input.outOfCity}, ${input.attendanceMode}, ${input.paymentMethod},
      ${input.receiptUrl}
    )
    RETURNING *;
  `;
  return rowToPhysicalRegistration(rows[0]);
}

export async function getPhysicalRegistrations(
  testId?: string
): Promise<PhysicalRegistration[]> {
  await ensureSchema();
  const { rows } = testId
    ? await sql<PhysicalRegistrationRow>`
        SELECT * FROM physical_registrations WHERE test_id = ${testId} ORDER BY created_at DESC;
      `
    : await sql<PhysicalRegistrationRow>`
        SELECT * FROM physical_registrations ORDER BY created_at DESC;
      `;
  return rows.map(rowToPhysicalRegistration);
}

export async function updatePhysicalRegistrationStatus(
  id: number,
  status: "pending" | "confirmed" | "rejected"
): Promise<boolean> {
  await ensureSchema();
  const result = await sql`
    UPDATE physical_registrations SET status = ${status} WHERE id = ${id};
  `;
  return (result.rowCount ?? 0) > 0;
}

export async function getPhysicalRegistrationForStudent(
  testId: string,
  rollNumber: string
): Promise<PhysicalRegistration | undefined> {
  await ensureSchema();
  const { rows } = await sql<PhysicalRegistrationRow>`
    SELECT * FROM physical_registrations
    WHERE test_id = ${testId} AND UPPER(roll_number) = UPPER(${rollNumber})
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  return rows[0] ? rowToPhysicalRegistration(rows[0]) : undefined;
}

export async function getPhysicalRegistrationById(
  id: number
): Promise<PhysicalRegistration | undefined> {
  await ensureSchema();
  const { rows } = await sql<PhysicalRegistrationRow>`
    SELECT * FROM physical_registrations WHERE id = ${id} LIMIT 1;
  `;
  return rows[0] ? rowToPhysicalRegistration(rows[0]) : undefined;
}

/**
 * Looks for an existing physical-test registration for the same test that
 * matches this new submission on a "same person" signal: same roll number,
 * same email, or same WhatsApp number. Name and city are intentionally NOT
 * used as duplicate signals — many different students can share the same
 * name and city, and that must not block their registration. Used to stop
 * one person from registering more than once for the same physical test
 * under slightly different details. Comparisons are case-insensitive and
 * trim whitespace.
 */
export async function findDuplicatePhysicalRegistration(
  testId: string,
  candidate: { name: string; email: string; whatsapp: string; city: string; rollNumber: string }
): Promise<PhysicalRegistration | undefined> {
  await ensureSchema();

  const email = candidate.email.trim().toLowerCase();
  const whatsapp = candidate.whatsapp.replace(/[^0-9]/g, "");
  const rollNumber = candidate.rollNumber.trim().toUpperCase();

  // Many different students can legitimately share the same name and city,
  // so name/city alone must NOT block a new registration. Only a matching
  // email or WhatsApp number (or the exact same roll number) means it's
  // really the same person registering again.
  const { rows } = await sql<PhysicalRegistrationRow>`
    SELECT * FROM physical_registrations
    WHERE test_id = ${testId}
      AND (
        (${rollNumber} <> '' AND UPPER(roll_number) = ${rollNumber})
        OR (${email} <> '' AND LOWER(email) = ${email})
        OR whatsapp = ${whatsapp}
      )
    ORDER BY created_at ASC
    LIMIT 1;
  `;

  return rows[0] ? rowToPhysicalRegistration(rows[0]) : undefined;
}

/**
 * Permanently removes a physical-test registration (e.g. a test
 * registration an admin made for themselves, or a duplicate/spam entry).
 * Used by the admin panel's Delete button.
 */
export async function deletePhysicalRegistration(id: number): Promise<boolean> {
  await ensureSchema();
  const result = await sql`
    DELETE FROM physical_registrations WHERE id = ${id};
  `;
  return (result.rowCount ?? 0) > 0;
}

/**
 * Updates the editable details of a physical-test registration (name, roll
 * number, WhatsApp, email, city) -- e.g. to fix a spelling mistake in a
 * student's name. Used by the admin panel's Edit button. Only the fields
 * present in `fields` are changed; omit a field to leave it untouched.
 */
export async function updatePhysicalRegistrationFields(
  id: number,
  fields: {
    name?: string;
    rollNumber?: string | null;
    whatsapp?: string;
    email?: string | null;
    city?: string;
  }
): Promise<PhysicalRegistration | undefined> {
  await ensureSchema();
  const current = await getPhysicalRegistrationById(id);
  if (!current) return undefined;

  const next = {
    name: fields.name !== undefined ? fields.name : current.name,
    rollNumber: fields.rollNumber !== undefined ? fields.rollNumber : current.rollNumber,
    whatsapp: fields.whatsapp !== undefined ? fields.whatsapp : current.whatsapp,
    email: fields.email !== undefined ? fields.email : current.email,
    city: fields.city !== undefined ? fields.city : current.city,
  };

  const { rows } = await sql<PhysicalRegistrationRow>`
    UPDATE physical_registrations SET
      name = ${next.name},
      roll_number = ${next.rollNumber},
      whatsapp = ${next.whatsapp},
      email = ${next.email},
      city = ${next.city}
    WHERE id = ${id}
    RETURNING *;
  `;
  return rows[0] ? rowToPhysicalRegistration(rows[0]) : undefined;
}
