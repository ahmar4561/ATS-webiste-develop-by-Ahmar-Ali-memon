export type Subject =
  | "biology"
  | "chemistry"
  | "physics"
  | "english"
  | "logical_reasoning";

export interface Student {
  rollNumber: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  createdAt: string;
}

export interface Question {
  id: number;
  subject: Subject;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TestAnswer {
  questionId: number;
  selectedIndex: number | null;
}

export type AttemptStatus = "not_started" | "in_progress" | "completed" | "auto_submitted";

export interface TestAttempt {
  rollNumber: string;
  testId: string;
  status: AttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  timeTakenSeconds: number;
  answers: TestAnswer[];
  score: number;
  correct: number;
  wrong: number;
  unattempted: number;
  percentage: number;
  autoSubmitReason?: "timeout" | "tab_switch" | "manual";
}

export interface StaticTopEntry {
  rank: number;
  name: string;
  city: string;
  score: number;
  totalMarks: number;
}

export interface TestDefinition {
  id: string;
  number: number;
  title: string;
  date: string;
  mode: "online" | "physical";
  isSunday: boolean;
  syllabus: SyllabusBreakdown;
  /** Manually entered top students — shown in popup instead of DB data */
  staticTop10?: StaticTopEntry[];
  /**
   * Path (under /public) to a downloadable PDF of this test's question
   * paper / answer key, e.g. "/past-papers/test-1-question-paper.pdf".
   * Once a test has concluded, set this so EVERY student — old, new,
   * whether or not they personally attempted that test — can download it
   * from their dashboard's "Past Papers" library. Leave undefined for
   * tests that haven't happened yet / have no PDF uploaded.
   */
  pastPaperUrl?: string;
  /** Optional short label for the download button, e.g. "Question Paper + Answer Key". */
  pastPaperLabel?: string;
  /**
   * Override the default 3-hour / 180-question exam format for this
   * specific test (e.g. a shorter single-subject test). Leave undefined
   * to use the platform defaults (EXAM_DURATION_SECONDS / TOTAL_QUESTIONS).
   */
  durationSeconds?: number;
  totalQuestions?: number;
}

export interface SyllabusBreakdown {
  biology?: string;
  chemistry?: string;
  physics?: string;
  english?: string;
}

export interface MeritEntry {
  rank: number;
  rollNumber: string;
  name: string;
  city: string;
  testId: string;
  testTitle: string;
  score: number;
  percentage: number;
  correct: number;
  wrong: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

export interface ExamSession {
  student: Student;
  attempt: TestAttempt;
}

export type PhysicalPaymentMethod = "bank" | "easypaisa";
export type PhysicalRegistrationStatus = "pending" | "confirmed" | "rejected";
export type AttendanceMode = "online" | "physical_plus_online";

export interface PhysicalRegistration {
  id: number;
  testId: string;
  name: string;
  rollNumber: string | null;
  whatsapp: string;
  email: string | null;
  city: string;
  outOfCity: boolean;
  attendanceMode: AttendanceMode;
  paymentMethod: PhysicalPaymentMethod;
  receiptUrl: string | null;
  status: PhysicalRegistrationStatus;
  createdAt: string;
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  english: "English",
  logical_reasoning: "Logical Reasoning",
};

export const SUBJECT_DISTRIBUTION: Record<Subject, number> = {
  biology: 81,
  chemistry: 45,
  physics: 36,
  english: 9,
  logical_reasoning: 9,
};

export const EXAM_DURATION_SECONDS = 3 * 60 * 60; // 3 hours
export const MARKS_CORRECT = 1;
export const MARKS_WRONG = 0;
export const TOTAL_QUESTIONS = 180;
