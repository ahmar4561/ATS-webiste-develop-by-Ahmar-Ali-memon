import { TestDefinition } from "./types";

export const PLATFORM = {
  name: "ATS",
  fullName: "Ale's Testing Service",
  tagline: "Practice. Analyze. Improve. Succeed.",
  helpline: "03482987385",
  whatsappGroup: "https://chat.whatsapp.com/IsXPutl4YQKArWe92sXchL",
  founder: {
    name: "Ali Raza",
    title: "Founder & CEO",
    company: "ATS - Ale's Testing Service",
  },
  series: "MDCAT Entry Test Mock Series 2026",
};

export const TESTS: TestDefinition[] = [
  {
    id: "test-1",
    number: 1,
    title: "Mock Test 1",
    date: "2026-06-21",
    mode: "online",
    isSunday: true,
    syllabus: {
      biology:
        "Unit 1-4: Acellular Life, Bioenergetics, Biological Molecules, Cell Structure & Function",
      chemistry:
        "Unit 1-5: Fundamentals of Chemistry, Atomic Structure, Gases, Liquids, Solids",
      physics:
        "Unit 1-4: Vectors & Equilibrium, Force & Motion, Work & Energy, Rotational & Circular Motion",
      english: "English Comprehension & Grammar",
    },
    staticTop10: [
      { rank: 1,  name: "Areej",              city: "",      score: 163, totalMarks: 180 },
      { rank: 2,  name: "Afshan",             city: "",      score: 162, totalMarks: 180 },
      { rank: 3,  name: "Mohsin Ali",         city: "",      score: 159, totalMarks: 180 },
      { rank: 4,  name: "Hina",               city: "",      score: 156, totalMarks: 180 },
      { rank: 5,  name: "Murk ZC",            city: "",      score: 155, totalMarks: 180 },
      { rank: 6,  name: "Sarmad Ali Chandio", city: "",      score: 154, totalMarks: 180 },
      { rank: 7,  name: "Kashaf",             city: "",      score: 153, totalMarks: 180 },
      { rank: 8,  name: "Rehman Shafique",    city: "",      score: 152, totalMarks: 180 },
      { rank: 9,  name: "Amna",               city: "",      score: 151, totalMarks: 180 },
      { rank: 10, name: "Saira Chandio",      city: "",      score: 151, totalMarks: 180 },
    ],
  },
  {
    id: "test-2",
    number: 2,
    title: "Mock Test 2",
    date: "2026-06-28",
    mode: "online",
    isSunday: true,
    syllabus: {
      biology:
        "Unit 5-8: Coordination & Control, Enzymes, Evolution, Reproduction",
      chemistry:
        "Unit 6-10: Chemical Equilibrium, Reaction Kinetics, Thermochemistry & Energetics, Electrochemistry, Chemical Bonding",
      physics:
        "Unit 5-8: Fluid Dynamics, Waves, Thermodynamics, Electrostatics",
      english: "English Comprehension & Grammar",
    },
  },
  {
    id: "test-3",
    number: 3,
    title: "Mock Test 3",
    date: "2026-07-05",
    mode: "online",
    isSunday: true,
    syllabus: {
      biology:
        "Unit 9-12: Support & Movement, Inheritance, Circulation, Immunity",
      chemistry:
        "Unit 11-15: s, p, d & f-Block Elements, Transition Elements, Organic Chemistry Basics, Hydrocarbons, Alkyl Halides",
      physics:
        "Unit 9-12: Current Electricity, Electromagnetism, Electromagnetic Induction, Alternating Current",
      english: "English Comprehension & Grammar",
    },
  },
  {
    id: "test-4",
    number: 4,
    title: "Mock Test 4",
    date: "2026-07-12",
    mode: "online",
    isSunday: true,
    syllabus: {
      biology:
        "Unit 13-16: Respiration, Digestion, Homeostasis, Biotechnology",
      chemistry:
        "Unit 16-20: Alcohols & Phenols, Aldehydes & Ketones, Carboxylic Acids, Macromolecules, Industrial Chemistry",
      physics:
        "Unit 13-16: Electronics, Dawn of Modern Physics, Atomic Spectra, Nuclear Physics",
      english: "English Comprehension & Grammar",
    },
  },
  {
    id: "mega-physical",
    number: 5,
    title: "Mega Physical Mock Test",
    date: "2026-07-19",
    mode: "physical",
    isSunday: true,
    syllabus: {
      biology: "Complete MDCAT Syllabus Review",
      chemistry: "Complete MDCAT Syllabus Review",
      physics: "Complete MDCAT Syllabus Review",
      english: "Complete MDCAT Syllabus Review",
    },
  },
];

export function getTestById(id: string): TestDefinition | undefined {
  return TESTS.find((t) => t.id === id);
}

export function formatTestDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const TEST_WINDOW_START_HOUR = 10; // 10:00 AM
export const TEST_WINDOW_END_HOUR = 22; // 10:00 PM

export type TestWindowStatus =
  | "locked" // wrong day entirely
  | "before_window" // correct day, before 10 AM
  | "open" // correct day, within 10 AM - 10 PM
  | "expired"; // correct day, after 10 PM — window closed for the day

export function getTestWindowStatus(
  dateStr: string,
  now: Date = new Date()
): TestWindowStatus {
  const testDate = new Date(dateStr + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const scheduled = new Date(
    testDate.getFullYear(),
    testDate.getMonth(),
    testDate.getDate()
  );

  if (today.getTime() !== scheduled.getTime()) {
    return "locked";
  }

  const hour = now.getHours();
  if (hour < TEST_WINDOW_START_HOUR) return "before_window";
  if (hour >= TEST_WINDOW_END_HOUR) return "expired";
  return "open";
}

export function isTestDayOpen(dateStr: string, now: Date = new Date()): boolean {
  return getTestWindowStatus(dateStr, now) === "open";
}

/**
 * Returns the most recent online test whose 10 PM submission window has
 * already closed (either it was earlier today and the clock has passed
 * 10 PM, or it took place on a past date). Used to decide which test's
 * Top 10 to show on the homepage. Returns undefined if no test has closed
 * yet (e.g. very first test hasn't happened or is still in progress).
 */
export function getLatestClosedTest(now: Date = new Date()): TestDefinition | undefined {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const closed = TESTS.filter((t) => {
    if (t.mode !== "online") return false;
    const testDate = new Date(t.date + "T00:00:00");
    const scheduled = new Date(
      testDate.getFullYear(),
      testDate.getMonth(),
      testDate.getDate()
    );
    if (scheduled.getTime() < today.getTime()) return true; // a past day
    if (scheduled.getTime() === today.getTime()) {
      return now.getHours() >= TEST_WINDOW_END_HOUR; // today, after 10 PM
    }
    return false; // future day
  });

  if (closed.length === 0) return undefined;
  return closed.sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export function getNextSundayCountdown(dateStr: string, now: Date = new Date()): {
  targetDate: Date;
  isPast: boolean;
} {
  const testDate = new Date(dateStr + "T10:00:00");
  return {
    targetDate: testDate,
    isPast: now > new Date(dateStr + "T22:00:00"),
  };
}
