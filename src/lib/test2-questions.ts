// Mock Test 2 — official ATS question bank.
//
// HOW TO ADD QUESTIONS:
// Just copy one of the objects below and edit it. Each question needs:
//   id            -> unique number, keep counting up (1, 2, 3...)
//   subject       -> one of: "biology" | "chemistry" | "physics" | "english" | "logical_reasoning"
//   text          -> the question itself
//   options       -> array of 4 answer choices
//   correctIndex  -> which option (0, 1, 2 or 3) is correct
//   explanation   -> short explanation shown on the results page
//
// Test 2 syllabus (from constants.ts) needs:
//   81 Biology questions   (ids 1-81)
//   45 Chemistry questions (ids 82-126)
//   36 Physics questions   (ids 127-162)
//   9 English questions    (ids 163-171)
//   9 Logical Reasoning    (ids 172-180)
// Total: 180 questions. Keep them in that order (Biology, then Chemistry,
// then Physics, then English, then Logical Reasoning) so review pages group
// nicely by subject.
//
// Until this file has all 180 real questions, Test 2 automatically falls
// back to placeholder auto-generated questions — see questions.ts.

import { Question } from "./types";

export const TEST_2_QUESTIONS: Question[] = [
  {
    id: 1,
    subject: "biology",
    text: "Replace this with your real Test 2 question 1.",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: 0,
    explanation: "Replace with the explanation for this question.",
  },
  // Add the remaining 179 questions below, following the same pattern.
];
