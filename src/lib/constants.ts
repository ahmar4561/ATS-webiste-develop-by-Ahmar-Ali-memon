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

/**
 * Payment details for the Physical Mock Test registration popup.
 * Fill in the real account name/number for each method once finalized —
 * this is the ONLY place that needs editing; the popup and admin panel
 * both read from here automatically. Date and venue stay "Coming Soon"
 * (dateConfirmed: false / venueConfirmed: false) until you're ready to
 * announce them — flip those booleans and fill in the text once confirmed.
 */
export const PHYSICAL_TEST_PAYMENT = {
  dateConfirmed: true,
  venueConfirmed: false,
  venue: "", // Coming Soon — fill once venue is confirmed
  registrationFee: "",
  // Fee depends on the mode the student picks at registration time.
  feeOnline: 400, // Online only
  feePhysicalPlusOnline: 800, // Physical (at venue) + Online
  methods: [
    {
      id: "bank",
      label: "Bank (UBL)",
      accountTitle: "Ahmar Ali",
      accountNumber: "0628282607098",
      bankName: "UBL",
    },
    {
      id: "easypaisa",
      label: "Easypaisa",
      accountTitle: "Ahmar Ali",
      accountNumber: "03456187264",
      bankName: "",
    },
  ],
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
    pastPaperUrl: "/past-papers/test-1-question-paper.pdf",
    pastPaperLabel: "Question Paper + Answer Key",
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
    pastPaperUrl: "/past-papers/test-2-answer-key.pdf",
    pastPaperLabel: "Answer Key + Concept Review",
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
    id: "test-5",
    number: 5,
    title: "Mock Test 5",
    date: "2026-07-19",
    mode: "online",
    isSunday: true,
    syllabus: {
      physics:
        "Complete Physics MDCAT Syllabus Review: Vectors & Equilibrium, Force & Motion, Work & Energy, Rotational & Circular Motion, Fluid Dynamics, Waves, Thermodynamics, Electrostatics, Current Electricity, Electromagnetism, Electromagnetic Induction, Alternating Current, Electronics, Dawn of Modern Physics, Atomic Spectra, Nuclear Physics",
    },
  },
  {
    id: "mega-physical",
    number: 6,
    title: "Mega Physical Mock Test",
    date: "2026-07-26",
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

// ============================================================================
// TEMPORARY TESTING OVERRIDE -- REMOVE BEFORE GOING LIVE
// Set this back to `false` once you're done test-driving a newly-added
// question set. While `true`, every online test is always "open" regardless
// of the real day/time, so you (the admin) can attempt it right now.
// Students should NEVER see this set to `true` during a real announced
// testing window, since it removes the Sunday 10AM-10PM restriction for
// everyone, not just you.
// ============================================================================
export const ADMIN_TESTING_OVERRIDE = false;

const PKT_TIMEZONE = "Asia/Karachi";

/**
 * Returns {year, month (0-indexed), day, hour} as they are RIGHT NOW in
 * Pakistan Time (UTC+5), regardless of what timezone the machine running
 * this code is actually set to. This matters because Vercel's servers run
 * in UTC, while every test's schedule (10 AM - 10 PM) is meant in Pakistan
 * local time -- without this conversion, the window would silently open
 * and close 5 hours later than intended for every student.
 */
function getPktParts(now: Date): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PKT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  // "hour" can come back as "24" for midnight with hour12:false in some
  // environments -- normalize that to 0.
  const hourRaw = parseInt(get("hour"), 10);
  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10) - 1,
    day: parseInt(get("day"), 10),
    hour: hourRaw === 24 ? 0 : hourRaw,
  };
}

export type TestWindowStatus =
  | "locked" // wrong day entirely
  | "before_window" // correct day, before 10 AM
  | "open" // correct day, within 10 AM - 10 PM
  | "expired"; // correct day, after 10 PM — window closed for the day

export function getTestWindowStatus(
  dateStr: string,
  now: Date = new Date()
): TestWindowStatus {
  if (ADMIN_TESTING_OVERRIDE) return "open";

  const [testYear, testMonth, testDay] = dateStr.split("-").map(Number);
  const pkt = getPktParts(now);

  const isSameDay =
    pkt.year === testYear && pkt.month === testMonth - 1 && pkt.day === testDay;

  if (!isSameDay) {
    return "locked";
  }

  if (pkt.hour < TEST_WINDOW_START_HOUR) return "before_window";
  if (pkt.hour >= TEST_WINDOW_END_HOUR) return "expired";
  return "open";
}

export function isTestDayOpen(dateStr: string, now: Date = new Date()): boolean {
  if (ADMIN_TESTING_OVERRIDE) return true;
  return getTestWindowStatus(dateStr, now) === "open";
}

/**
 * Returns the most recent online test whose 10 PM submission window has
 * already closed (either it was earlier today and the clock has passed
 * 10 PM, or it took place on a past date). Used to decide which test's
 * Top 10 to show on the homepage. Returns undefined if no test has closed
 * yet (e.g. very first test hasn't happened or is still in progress).
 * All comparisons are done in Pakistan Time -- see getPktParts() above.
 */
export function getLatestClosedTest(now: Date = new Date()): TestDefinition | undefined {
  const pkt = getPktParts(now);
  const todayKey = pkt.year * 10000 + (pkt.month + 1) * 100 + pkt.day;

  const closed = TESTS.filter((t) => {
    if (t.mode !== "online") return false;
    const [ty, tm, td] = t.date.split("-").map(Number);
    const testKey = ty * 10000 + tm * 100 + td;

    if (testKey < todayKey) return true; // a past day
    if (testKey === todayKey) {
      return pkt.hour >= TEST_WINDOW_END_HOUR; // today, after 10 PM PKT
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
  // The test's 10 AM / 10 PM window is meant in Pakistan Time (UTC+5), so
  // the target/cutoff instants must be built as fixed UTC offsets, not as
  // "local time" on whatever machine happens to run this code.
  const targetDate = new Date(`${dateStr}T10:00:00+05:00`);
  const cutoffDate = new Date(`${dateStr}T22:00:00+05:00`);
  return {
    targetDate,
    isPast: now > cutoffDate,
  };
}
