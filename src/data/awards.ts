export type NominationQuestion = {
  id: string;
  section: string;
  prompt: string;
  wordLimit?: number;
  evidence?: string[];
};

export type AwardCategory = {
  id: string;
  name: string;
  short: string;
  tagline: string;
  description: string;
  recognises: string[];
  questions: NominationQuestion[];
};

// ─── Judge evaluation criteria ────────────────────────────────────────────────
// Each category has its own set of judge criteria derived from its nomination
// questions. Judges rate 1–5 stars per criterion; the leaderboard sums the totals.
//
// Keep `id` values stable once scoring begins — changing an id orphans saved scores.

export type EvaluationCriterion = {
  id: string;
  /** Short label shown above the star picker */
  label: string;
  /** Optional helper text describing what to assess */
  description?: string;
  /** Maximum stars for this criterion (default 5) */
  max?: number;
  /** Weight used when computing the weighted average (default 1) */
  weight?: number;
};

// ─── Per-category criteria ────────────────────────────────────────────────────
// Weights mirror the official Registrar's Ambit evaluation forms (weight % per
// criterion, 1–5 rating scale).

const CRITERIA_LIVING_VALUES: EvaluationCriterion[] = [
  { id: "lv-c1", label: "Core Values", description: "Which University core value(s) (Accountability, Respect, Integrity, Honesty, Transparency) did the nominee consistently demonstrate?", max: 5, weight: 25 },
  { id: "lv-c2", label: "Lasting Impact", description: "Did the nominee's actions make a positive and lasting impact in their unit or department, or beyond?", max: 5, weight: 25 },
  { id: "lv-c3", label: "Teamwork & Fairness", description: "Evidence of teamwork, respect, fairness, and contribution to shared goals.", max: 5, weight: 25 },
  { id: "lv-c4", label: "Leadership & Sustainability", description: "Examples of leadership, responsibility, and commitment to sustainability.", max: 5, weight: 25 },
];

const CRITERIA_BEST_UNIT: EvaluationCriterion[] = [
  { id: "bpu-c1", label: "Strategic Alignment", description: "How does the unit align its strategies and activities with ENVISION2030 and the DUT Way?", max: 5, weight: 20 },
  { id: "bpu-c2", label: "Service Standards", description: "Does the unit deliver consistently high standards of service and performance?", max: 5, weight: 20 },
  { id: "bpu-c3", label: "Measurable Impact", description: "What measurable impact has the unit had on student/university well-being, engagement, or success?", max: 5, weight: 20 },
  { id: "bpu-c4", label: "Innovation", description: "Innovative approaches introduced by the unit.", max: 5, weight: 20 },
  { id: "bpu-c5", label: "Professionalism & Values", description: "Does the unit uphold professionalism, respect, integrity, and excellence?", max: 5, weight: 20 },
];

const CRITERIA_LEADERSHIP_MENTORSHIP: EvaluationCriterion[] = [
  { id: "lm-c1", label: "Leadership & Integrity", description: "Did the nominee demonstrate outstanding leadership and integrity?", max: 5, weight: 20 },
  { id: "lm-c2", label: "Mentorship", description: "Examples of mentorship that supported colleagues or students.", max: 5, weight: 20 },
  { id: "lm-c3", label: "Influence on Development", description: "How did the nominee positively influence the development of others?", max: 5, weight: 20 },
  { id: "lm-c4", label: "Developing Future Leaders", description: "Did they invest in developing future leaders?", max: 5, weight: 20 },
  { id: "lm-c5", label: "Values-Reflected Leadership", description: "Does their leadership reflect DUT values?", max: 5, weight: 20 },
];

const CRITERIA_RISING_STAR: EvaluationCriterion[] = [
  { id: "rs-c1", label: "Early Contributions", description: "Significant contributions made within the nominee's first 5 years.", max: 5, weight: 20 },
  { id: "rs-c2", label: "Initiative & Problem-Solving", description: "Examples of initiative and problem-solving that positively influenced their unit or the university.", max: 5, weight: 20 },
  { id: "rs-c3", label: "Community Influence", description: "How have they positively influenced the university community?", max: 5, weight: 20 },
  { id: "rs-c4", label: "Learning & Growth", description: "Commitment to learning and growth.", max: 5, weight: 20 },
  { id: "rs-c5", label: "Upholding DUT Values", description: "Evidence of upholding DUT values.", max: 5, weight: 20 },
];

const CRITERIA_BEST_COLLABORATION: EvaluationCriterion[] = [
  { id: "bc-c1", label: "Collaborative Project", description: "Quality of the collaborative project or initiative described.", max: 5, weight: 25 },
  { id: "bc-c2", label: "Trust & Communication", description: "Did the team demonstrate trust and effective communication?", max: 5, weight: 25 },
  { id: "bc-c3", label: "Cross-Department Collaboration", description: "Did the collaboration bridge multiple roles or departments?", max: 5, weight: 25 },
  { id: "bc-c4", label: "Measurable Outcomes", description: "Measurable outcomes or results achieved.", max: 5, weight: 25 },
];

const CRITERIA_OUTSTANDING_REGISTRARS: EvaluationCriterion[] = [
  { id: "or-c1", label: "Above and Beyond", description: "Did the nominee go above and beyond to enhance the student/staff experience?", max: 5, weight: 25 },
  { id: "or-c2", label: "Creativity & Innovation", description: "Examples of creativity or innovation in service delivery.", max: 5, weight: 25 },
  { id: "or-c3", label: "Measurable Impact", description: "Measurable positive impact on students, staff or structures (performance, satisfaction, well-being).", max: 5, weight: 25 },
  { id: "or-c4", label: "Collaboration", description: "Evidence of collaboration with other departments.", max: 5, weight: 25 },
];

/** Criteria map keyed by category id */
const CRITERIA_BY_CATEGORY: Record<string, EvaluationCriterion[]> = {
  "living-values": CRITERIA_LIVING_VALUES,
  "best-performing-unit": CRITERIA_BEST_UNIT,
  "leadership-mentorship": CRITERIA_LEADERSHIP_MENTORSHIP,
  "rising-star": CRITERIA_RISING_STAR,
  "best-collaboration": CRITERIA_BEST_COLLABORATION,
  "outstanding-registrars": CRITERIA_OUTSTANDING_REGISTRARS,
};

/** Fallback for unknown/missing category ids */
export const EVALUATION_CRITERIA: EvaluationCriterion[] = CRITERIA_LIVING_VALUES;

/**
 * Returns the evaluation criteria for a given category id.
 * Falls back to Living the Values criteria if the id is not recognised.
 */
export function getCriteriaForCategory(categoryId?: string): EvaluationCriterion[] {
  if (!categoryId) return EVALUATION_CRITERIA;
  return CRITERIA_BY_CATEGORY[categoryId] ?? EVALUATION_CRITERIA;
}

/** Weighted average (0–5 scale) of a set of per-criterion star ratings. */
export function computeWeightedAverage(
  criteriaScores: Record<string, number>,
  criteria: EvaluationCriterion[] = EVALUATION_CRITERIA,
): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const c of criteria) {
    const raw = criteriaScores[c.id];
    if (typeof raw !== "number" || raw <= 0) continue;
    const max = c.max ?? 5;
    const weight = c.weight ?? 1;
    // Normalise each criterion onto a 0–5 scale before weighting.
    const normalised = (raw / max) * 5;
    weightedSum += normalised * weight;
    weightTotal += weight;
  }
  return weightTotal === 0 ? 0 : weightedSum / weightTotal;
}

export const AWARD_THEME = {
  title: "Registrar's Ambit Staff Awards",
  subtitle: "Recognising Excellence · Celebrating Service · Honouring Our People",
  eventName: "Registrar's Ambit Staff Awards",
  recognitionPeriod: "1 July 2024 – 30 June 2025",
  nominationWindow: "TBC",
  closingDate: "TBC",
  /** ISO date strings for judge scoring window — wide open until real dates are confirmed */
  scoringOpenDate: "2025-01-01",
  scoringDeadline: "2027-12-31",
  venue: "TBC",
  openingAddressTitle: "Welcome & Opening Address",
  openingAddressRemarks: "Registrar's remarks",
  yearsBadge: "Registrar's Ambit Staff Awards",
  /** Judge session times — single session until the ceremony is scheduled */
  judgeSessions: [
    { name: "Session 1", startTime: "TBC", endTime: "TBC" },
  ],
};

export const AWARD_CATEGORIES: AwardCategory[] = [
  {
    id: "living-values",
    name: "Living the Values Staff Award",
    short: "Living the Values",
    tagline: "Excellence, integrity and DUT's values in action.",
    description:
      "The Living the Values Award recognises a staff employee that best exemplifies excellence in one or more of the University's key values: Accountability, Respect, Integrity, Honesty and Transparency, and the key principles: Professionalism, Commitment, Compassion, Fairness and Excellence. Nominees must have shown extraordinary adoption of one or more of the key values in a work-related situation.",
    recognises: [
      "Consistent demonstration of one or more of the University's core values: Accountability, Respect, Integrity, Honesty, and Transparency",
      "The key principles of Professionalism, Commitment, Compassion, Fairness, and Excellence in daily work",
      "Actions that made a positive and lasting impact within their department or beyond",
      "Effective teamwork, demonstrating respect, fairness, and a commitment to shared goals",
      "A proven track record of leadership and responsibility in advancing the University's values and principles",
      "A commitment to both personal and institutional sustainability",
      "Outstanding professional ethics and a commitment to transparency",
    ],
    questions: [
      { id: "lv-1", section: "Core Values", prompt: "Which University core value(s) (Accountability, Respect, Integrity, Honesty, Transparency) did the nominee consistently demonstrate?", wordLimit: 300, evidence: ["Work records showing this", "Feedback or reports"] },
      { id: "lv-2", section: "Lasting Impact", prompt: "Describe how the nominee's actions made a positive and lasting impact in their unit or department, or beyond.", wordLimit: 300, evidence: ["Measurable results", "Testimonials"] },
      { id: "lv-3", section: "Teamwork & Fairness", prompt: "Provide evidence of teamwork, respect, fairness, and contribution to shared goals.", wordLimit: 300, evidence: ["Emails", "Project records", "Peer statements"] },
      { id: "lv-4", section: "Leadership & Sustainability", prompt: "Provide examples of leadership, responsibility, and commitment to sustainability.", wordLimit: 300, evidence: ["Reports", "Initiatives", "Recognition received"] },
    ],
  },
  {
    id: "best-performing-unit",
    name: "Best Performing Unit Award",
    short: "Best Performing Unit",
    tagline: "Units delivering excellence, aligned to ENVISION2030.",
    description:
      "Recognises a unit within the Registrar's Ambit that consistently delivers high-quality service, aligns its work with ENVISION2030 and the DUT Way, and demonstrates measurable impact, innovation and professionalism.",
    recognises: [
      "Strategic alignment with ENVISION2030 and the DUT Way",
      "Consistently high standards of service and performance",
      "Measurable positive impact on students, staff and university structures",
      "Innovative approaches introduced to improve service delivery",
      "Professionalism, respect, integrity and excellence in daily operations",
    ],
    questions: [
      { id: "bpu-1", section: "Strategic Alignment", prompt: "How does the unit align its strategies and activities with ENVISION2030 and the DUT Way?", wordLimit: 300, evidence: ["Strategic plans", "Minutes", "Performance reports"] },
      { id: "bpu-2", section: "Service Standards", prompt: "Describe how the unit delivers consistently high standards of service and performance.", wordLimit: 300, evidence: ["Performance metrics", "Quality audits"] },
      { id: "bpu-3", section: "Measurable Impact", prompt: "What measurable impact has the unit had on student/university well-being, engagement, or success?", wordLimit: 300, evidence: ["Statistics", "Feedback", "Surveys"] },
      { id: "bpu-4", section: "Innovation", prompt: "Describe any innovative approaches introduced by the unit.", wordLimit: 300, evidence: ["Project proposals", "Before-and-after evidence"] },
      { id: "bpu-5", section: "Professionalism & Values", prompt: "How does the unit uphold professionalism, respect, integrity, and excellence?", wordLimit: 300, evidence: ["Evaluations", "Recognition letters"] },
    ],
  },
  {
    id: "leadership-mentorship",
    name: "Leadership & Mentorship Award",
    short: "Leadership & Mentorship",
    tagline: "Leading with integrity, investing in others.",
    description:
      "Recognises a staff member who demonstrates outstanding leadership and integrity, and who actively invests in mentoring and developing colleagues and future leaders.",
    recognises: [
      "Outstanding leadership and integrity in daily work",
      "Active mentorship that supports colleagues' growth",
      "Positive influence on the development of others",
      "Investment in developing future leaders",
      "Leadership that reflects DUT's values",
    ],
    questions: [
      { id: "lm-1", section: "Leadership & Integrity", prompt: "Describe how the nominee demonstrated outstanding leadership and integrity.", wordLimit: 300, evidence: ["Performance reviews", "Peer endorsements"] },
      { id: "lm-2", section: "Mentorship", prompt: "Provide examples of mentorship that supported colleagues or students.", wordLimit: 300, evidence: ["Mentoring logs", "Testimonials", "Mentee achievements"] },
      { id: "lm-3", section: "Influence on Development", prompt: "How did the nominee positively influence the development of others?", wordLimit: 300, evidence: ["Training sessions", "Coaching records", "Outcomes"] },
      { id: "lm-4", section: "Developing Future Leaders", prompt: "Describe how they invested in developing future leaders.", wordLimit: 300, evidence: ["Evidence of programmes", "Feedback forms", "Growth plans"] },
      { id: "lm-5", section: "Values-Reflected Leadership", prompt: "Provide examples of how their leadership reflects DUT values.", wordLimit: 300, evidence: ["Written endorsements", "Case studies"] },
    ],
  },
  {
    id: "rising-star",
    name: "Rising Star Staff Award",
    short: "Rising Star",
    tagline: "Early-career impact, already shining.",
    description:
      "Honours a staff member within their first five years at DUT who has made a significant contribution, shown initiative and problem-solving, and demonstrated a strong commitment to learning, growth and the University's values.",
    recognises: [
      "Significant contributions made within the first 5 years of service",
      "Initiative and problem-solving that positively influenced their unit or the university",
      "Positive influence on the university community",
      "Demonstrated commitment to learning and growth",
      "Evidence of upholding DUT values",
    ],
    questions: [
      { id: "rs-1", section: "Early Contributions", prompt: "What significant contributions have the nominee made within their first 5 years?", wordLimit: 300, evidence: ["Project records", "Awards", "Letters"] },
      { id: "rs-2", section: "Initiative & Problem-Solving", prompt: "Provide examples of initiative and problem-solving that positively influenced their unit or the university.", wordLimit: 300, evidence: ["Evidence of successful solutions"] },
      { id: "rs-3", section: "Community Influence", prompt: "How have they positively influenced the university community?", wordLimit: 300, evidence: ["Feedback from colleagues/students"] },
      { id: "rs-4", section: "Learning & Growth", prompt: "Show their commitment to learning and growth.", wordLimit: 300, evidence: ["Certificates", "Training records", "CPD logs"] },
      { id: "rs-5", section: "Upholding DUT Values", prompt: "Provide evidence of upholding DUT values.", wordLimit: 300, evidence: ["Supervisor reports", "Testimonials"] },
    ],
  },
  {
    id: "best-collaboration",
    name: "Best Collaboration Award",
    short: "Best Collaboration",
    tagline: "Trust, teamwork, results across boundaries.",
    description:
      "Recognises a team or partnership that achieved outstanding results through effective collaboration — bridging roles, departments or units with trust, clear communication and measurable outcomes.",
    recognises: [
      "A clearly described collaborative project or initiative",
      "Trust and effective communication within the team",
      "Collaboration that bridged multiple roles or departments",
      "Measurable outcomes or results achieved",
    ],
    questions: [
      { id: "bc-1", section: "Collaborative Project", prompt: "Describe the collaborative project or initiative.", wordLimit: 300, evidence: ["Project plan", "Meeting minutes"] },
      { id: "bc-2", section: "Trust & Communication", prompt: "Show how the team demonstrated trust and effective communication.", wordLimit: 300, evidence: ["Team feedback", "Process documents"] },
      { id: "bc-3", section: "Cross-Department Collaboration", prompt: "Describe how collaboration bridged multiple roles or departments.", wordLimit: 300, evidence: ["Organogram", "Partnership documents"] },
      { id: "bc-4", section: "Measurable Outcomes", prompt: "Provide measurable outcomes or results achieved.", wordLimit: 300, evidence: ["Data", "Reports", "Evidence of success"] },
    ],
  },
  {
    id: "outstanding-registrars",
    name: "Outstanding Registrars Staff Award",
    short: "Outstanding Registrars Staff",
    tagline: "The flagship award for exceptional service.",
    description:
      "The flagship Registrar's Ambit award, recognising a staff member who consistently goes above and beyond to enhance the experience of students and colleagues, bringing creativity, measurable impact and cross-departmental collaboration to their service.",
    recognises: [
      "Going above and beyond to enhance the student/staff experience",
      "Creativity and innovation in service delivery",
      "Measurable positive impact on students, staff or structures",
      "Evidence of collaboration with other departments",
    ],
    questions: [
      { id: "or-1", section: "Above and Beyond", prompt: "Describe how the nominee went above and beyond to enhance the student/staff experience.", wordLimit: 300, evidence: ["Specific examples", "Feedback"] },
      { id: "or-2", section: "Creativity & Innovation", prompt: "Provide examples of creativity or innovation in service delivery.", wordLimit: 300, evidence: ["Implementation evidence"] },
      { id: "or-3", section: "Measurable Impact", prompt: "Show measurable positive impact on students, staff or structures (performance, satisfaction, well-being).", wordLimit: 300, evidence: ["Data or survey results"] },
      { id: "or-4", section: "Collaboration", prompt: "Provide evidence of collaboration with other departments.", wordLimit: 300, evidence: ["Joint project documents", "Feedback"] },
    ],
  },
];

export type CategoryId = (typeof AWARD_CATEGORIES)[number]["id"];

/**
 * Eligibility checks from the official evaluation form. Gating questions
 * shown on nomination Step 1 — not judged/scored criteria.
 */
export const ELIGIBILITY_QUESTIONS = [
  { id: "workPeriod", label: "Is the submission based on evidence of work that occurred between 1 July 2024 and 30 June 2025?" },
  { id: "notResubmitted", label: "Confirm this nominee has not been submitted for the same project/contribution in the last three years." },
  { id: "notMultiNominated", label: "Confirm this project/contribution has not already been nominated for more than one award in this Awards Framework." },
] as const;

export const PAST_WINNERS: {
  year: number;
  category: string;
  name: string;
  department: string;
  quote: string;
}[] = [];
