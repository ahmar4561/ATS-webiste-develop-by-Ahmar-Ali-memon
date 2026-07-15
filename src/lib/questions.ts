import {
  Question,
  Subject,
  SUBJECT_DISTRIBUTION,
  TestAnswer,
  MARKS_CORRECT,
  MARKS_WRONG,
  TOTAL_QUESTIONS,
} from "./types";
import { TEST_1_QUESTIONS } from "./test1-questions";
import { TEST_2_QUESTIONS } from "./test2-questions";

const SUBJECT_TOPICS: Record<Subject, string[]> = {
  biology: [
    "Cell membrane transport mechanisms",
    "Photosynthesis light-dependent reactions",
    "Enzyme kinetics and inhibition",
    "DNA replication and transcription",
    "Mendelian inheritance patterns",
    "Human cardiovascular system",
    "Immune response and antibodies",
    "Evolutionary mechanisms",
    "Plant support tissues",
    "Biotechnology applications",
    "Bioenergetics and ATP synthesis",
    "Biological molecules structure",
  ],
  chemistry: [
    "Atomic structure and orbitals",
    "Gas laws and kinetic theory",
    "Chemical equilibrium constants",
    "Reaction rate and order",
    "Thermochemistry enthalpy",
    "Electrochemical cells",
    "Chemical bonding types",
    "Periodic table trends",
    "Organic functional groups",
    "Hydrocarbon nomenclature",
    "Alkyl halide reactions",
    "Industrial chemical processes",
  ],
  physics: [
    "Vector addition and equilibrium",
    "Newton's laws of motion",
    "Work-energy theorem",
    "Rotational dynamics",
    "Fluid pressure and buoyancy",
    "Wave properties and interference",
    "Thermodynamics laws",
    "Electrostatic force and field",
    "Ohm's law and circuits",
    "Electromagnetic induction",
    "Alternating current circuits",
    "Nuclear decay and radiation",
  ],
  english: [
    "Reading comprehension passage",
    "Grammar and sentence correction",
    "Vocabulary in context",
    "Synonyms and antonyms",
    "Sentence completion",
    "Error identification",
    "Paragraph organization",
    "Critical reading inference",
    "Word usage and meaning",
  ],
  logical_reasoning: [
    "Number series pattern",
    "Logical deduction puzzle",
    "Analytical reasoning",
    "Pattern recognition",
    "Syllogism evaluation",
    "Data interpretation",
    "Sequence completion",
    "Cause and effect analysis",
    "Statement and conclusion",
  ],
};

function generateQuestion(
  id: number,
  subject: Subject,
  testNumber: number
): Question {
  const topics = SUBJECT_TOPICS[subject];
  const topic = topics[(id + testNumber) % topics.length];
  const correctIndex = (id * 7 + testNumber * 3) % 4;

  const options = [
    `Option A: Primary concept related to ${topic}`,
    `Option B: Secondary principle of ${topic}`,
    `Option C: Alternative explanation for ${topic}`,
    `Option D: Correct application of ${topic} (MDCAT standard)`,
  ];

  // Shuffle so correct isn't always D - deterministic per question
  const shift = (id + testNumber) % 4;
  const shuffled = [...options.slice(shift), ...options.slice(0, shift)];
  const newCorrectIndex = (correctIndex - shift + 4) % 4;

  return {
    id,
    subject,
    text: `[${subject.replace("_", " ").toUpperCase()}] Q${id}: Based on MDCAT Mock Test ${testNumber} syllabus — ${topic}. Select the most accurate answer according to the latest PMC pattern.`,
    options: shuffled,
    correctIndex: newCorrectIndex,
    explanation: `The correct answer relates to ${topic}. Review the corresponding unit in your MDCAT textbook for detailed explanation. This question assesses conceptual understanding as per ATS Mock Series ${testNumber} syllabus coverage.`,
  };
}

export function generateQuestionsForTest(testNumber: number): Question[] {
  // Mock Test 1 uses the official ATS question bank.
  if (testNumber === 1) {
    return TEST_1_QUESTIONS;
  }

  // Mock Test 2 uses the official ATS question bank once it's fully filled
  // in (see test2-questions.ts). Until then, it falls back to placeholder
  // questions below so the test still works end-to-end for testing.
  if (testNumber === 2 && TEST_2_QUESTIONS.length >= TOTAL_QUESTIONS) {
    return TEST_2_QUESTIONS;
  }

  const questions: Question[] = [];
  let id = 1;

  const subjects = Object.entries(SUBJECT_DISTRIBUTION) as [Subject, number][];

  for (const [subject, count] of subjects) {
    for (let i = 0; i < count; i++) {
      questions.push(generateQuestion(id, subject, testNumber));
      id++;
    }
  }

  return questions;
}

export async function getQuestionsForTest(
  testId: string,
  testNumber: number
): Promise<Question[]> {
  // Admin-saved questions (pasted in from the admin dashboard) always take
  // priority over the hardcoded/placeholder banks below. Not cached, so an
  // admin update is reflected immediately on the next request.
  const { getAdminQuestions } = await import("./storage");
  const adminQuestions = await getAdminQuestions(testNumber).catch(() => null);
  return adminQuestions ?? generateQuestionsForTest(testNumber);
}

export function calculateScore(
  answers: TestAnswer[],
  questions: Question[]
): {
  score: number;
  correct: number;
  wrong: number;
  unattempted: number;
  percentage: number;
  breakdown: {
    questionId: number;
    selectedIndex: number | null;
    correctIndex: number;
    isCorrect: boolean;
    isWrong: boolean;
    isUnattempted: boolean;
    marks: number;
  }[];
} {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  let correct = 0;
  let wrong = 0;
  let unattempted = 0;
  let score = 0;

  const breakdown = answers.map((answer) => {
    const question = questionMap.get(answer.questionId)!;
    const isUnattempted = answer.selectedIndex === null;

    if (isUnattempted) {
      unattempted++;
      return {
        questionId: answer.questionId,
        selectedIndex: answer.selectedIndex,
        correctIndex: question.correctIndex,
        isCorrect: false,
        isWrong: false,
        isUnattempted: true,
        marks: 0,
      };
    }

    const isCorrect = answer.selectedIndex === question.correctIndex;
    if (isCorrect) {
      correct++;
      score += MARKS_CORRECT;
    } else {
      wrong++;
      score += MARKS_WRONG;
    }

    return {
      questionId: answer.questionId,
      selectedIndex: answer.selectedIndex,
      correctIndex: question.correctIndex,
      isCorrect,
      isWrong: !isCorrect,
      isUnattempted: false,
      marks: isCorrect ? MARKS_CORRECT : MARKS_WRONG,
    };
  });

  const maxScore = TOTAL_QUESTIONS * MARKS_CORRECT;
  const percentage = Math.max(0, (score / maxScore) * 100);

  return { score, correct, wrong, unattempted, percentage, breakdown };
}

export function createEmptyAnswers(): TestAnswer[] {
  return Array.from({ length: TOTAL_QUESTIONS }, (_, i) => ({
    questionId: i + 1,
    selectedIndex: null,
  }));
}

export function formatTime(seconds: number): string {
  const safeSeconds =
    Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
