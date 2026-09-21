// One-off seed script: creates 2 fake nominations per award category (12 total)
// plus one admin and one judge Firebase Auth account, so the Firestore/Storage
// flow can be exercised end-to-end on the admin side.
//
// Usage:
//   node --env-file=.env scripts/seed-fake-data.mjs
//
// Safe to re-run: nominations are written with deterministic doc IDs
// ("seed-<categoryId>-<n>") so re-running overwrites the same fake docs
// instead of duplicating them, and the admin/judge users are created only
// if they don't already exist (existing ones just get their claims refreshed).

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const b64 = process.env.FIREBASE_ADMIN_SDK_B64;
if (!b64) {
  console.error("❌ FIREBASE_ADMIN_SDK_B64 not set. Run with: node --env-file=.env scripts/seed-fake-data.mjs");
  process.exit(1);
}

const serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
const projectId = serviceAccount.project_id;
console.log(`🔥 Using Firebase project: ${projectId}\n`);

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

// ─── Seed accounts ─────────────────────────────────────────────────────────

const SEED_PASSWORD = "SeedDemo@2026";

const SEED_USERS = [
  { email: "seed.admin@dut.ac.za", role: "admin", displayName: "Seed Admin (Demo)" },
  { email: "seed.judge@dut.ac.za", role: "judge", displayName: "Seed Judge (Demo)" },
];

async function seedUser({ email, role, displayName }) {
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password: SEED_PASSWORD,
      displayName,
      emailVerified: true,
    });
    console.log(`✅ Created ${role}: ${email}`);
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      userRecord = await auth.getUserByEmail(email);
      console.log(`↺ ${role} already exists, reusing: ${email}`);
    } else {
      throw err;
    }
  }

  // Custom claims (checked first by admin.tsx) + Firestore users/{uid} doc
  // (fallback path used by self-registered accounts) — cover both.
  await auth.setCustomUserClaims(userRecord.uid, { role });
  await db.collection("users").doc(userRecord.uid).set(
    { email, role, displayName, createdAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  return userRecord;
}

// ─── Fake nominations ───────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Academic Data and Student Records",
  "Student Admissions",
  "Student Administration (Registration, Graduation Audits, Timetabling)",
  "Examinations",
  "Human Capital Services (Human Resources)",
  "Information Technology and Support Services (ITSS)",
  "Faculty of Health Sciences (Dean's Office)",
  "Faculty of Engineering and the Built Environment (Dean's Office)",
  "Library and Information Services",
  "Student Financial Aid (Financial Aid Unit)",
  "Corporate Affairs (Marketing, Communications, PR, Design Studio, Fundraising, Student Recruitment)",
  "Faculty of Management Sciences (Dean's Office)",
];

const RELATIONSHIPS = ["Colleague", "Manager / Supervisor", "HR", "Other Staff Member"];

// Placeholder "uploaded" file — points at nothing real; it's here purely so the
// admin/judge document-completeness UI has something to render for seed data.
function fakeFile(categoryId, seedId, questionId, slotIndex, label) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const path = `nominations/${categoryId}/${seedId}/${questionId}/e${slotIndex}/${slug}.pdf`;
  return {
    name: `${slug || "evidence"}.pdf`,
    url: `https://storage.googleapis.com/${projectId}.appspot.com/${path}`,
    size: 245_760,
    path,
  };
}

function buildUploads(categoryId, seedId, questions, complete) {
  const uploads = {};
  for (const q of questions) {
    if (!q.evidence?.length) continue;
    if (!complete) continue; // leave uploads empty to demo the "missing documents" state
    const slots = {};
    q.evidence.forEach((label, i) => {
      slots[`e${i}`] = [fakeFile(categoryId, seedId, q.id, i, label)];
    });
    uploads[q.id] = slots;
  }
  return uploads;
}

function buildAnswers(questions, answerText) {
  const answers = {};
  for (const q of questions) {
    answers[q.id] = answerText;
  }
  return answers;
}

const CATEGORIES = [
  {
    id: "living-values",
    name: "Living the Values Staff Award",
    questions: [
      { id: "lv-1", evidence: ["Work records showing this", "Feedback or reports"] },
      { id: "lv-2", evidence: ["Measurable results", "Testimonials"] },
      { id: "lv-3", evidence: ["Emails", "Project records", "Peer statements"] },
      { id: "lv-4", evidence: ["Reports", "Initiatives", "Recognition received"] },
    ],
  },
  {
    id: "best-performing-unit",
    name: "Best Performing Unit Award",
    questions: [
      { id: "bpu-1", evidence: ["Strategic plans", "Minutes", "Performance reports"] },
      { id: "bpu-2", evidence: ["Performance metrics", "Quality audits"] },
      { id: "bpu-3", evidence: ["Statistics", "Feedback", "Surveys"] },
      { id: "bpu-4", evidence: ["Project proposals", "Before-and-after evidence"] },
      { id: "bpu-5", evidence: ["Evaluations", "Recognition letters"] },
    ],
  },
  {
    id: "leadership-mentorship",
    name: "Leadership & Mentorship Award",
    questions: [
      { id: "lm-1", evidence: ["Performance reviews", "Peer endorsements"] },
      { id: "lm-2", evidence: ["Mentoring logs", "Testimonials", "Mentee achievements"] },
      { id: "lm-3", evidence: ["Training sessions", "Coaching records", "Outcomes"] },
      { id: "lm-4", evidence: ["Evidence of programmes", "Feedback forms", "Growth plans"] },
      { id: "lm-5", evidence: ["Written endorsements", "Case studies"] },
    ],
  },
  {
    id: "rising-star",
    name: "Rising Star Staff Award",
    questions: [
      { id: "rs-1", evidence: ["Project records", "Awards", "Letters"] },
      { id: "rs-2", evidence: ["Evidence of successful solutions"] },
      { id: "rs-3", evidence: ["Feedback from colleagues/students"] },
      { id: "rs-4", evidence: ["Certificates", "Training records", "CPD logs"] },
      { id: "rs-5", evidence: ["Supervisor reports", "Testimonials"] },
    ],
  },
  {
    id: "best-collaboration",
    name: "Best Collaboration Award",
    questions: [
      { id: "bc-1", evidence: ["Project plan", "Meeting minutes"] },
      { id: "bc-2", evidence: ["Team feedback", "Process documents"] },
      { id: "bc-3", evidence: ["Organogram", "Partnership documents"] },
      { id: "bc-4", evidence: ["Data", "Reports", "Evidence of success"] },
    ],
  },
  {
    id: "outstanding-registrars",
    name: "Outstanding Registrars Staff Award",
    questions: [
      { id: "or-1", evidence: ["Specific examples", "Feedback"] },
      { id: "or-2", evidence: ["Implementation evidence"] },
      { id: "or-3", evidence: ["Data or survey results"] },
      { id: "or-4", evidence: ["Joint project documents", "Feedback"] },
    ],
  },
];

const NOMINEE_PAIRS = [
  ["Thandeka Mhlongo", "Sipho Dlamini"],
  ["Nomvula Khumalo", "Ayanda Zulu"],
  ["Bongani Ngcobo", "Lindiwe Mkhize"],
  ["Precious Buthelezi", "Musa Ndlovu"],
  ["Zanele Cele", "Thabo Mokoena"],
  ["Sanele Mthembu", "Nolwazi Gumede"],
  ["Vusi Radebe", "Nokuthula Shabalala"],
  ["Andile Sithole", "Palesa Mahlangu"],
  ["Nokwanda Mbatha", "Sabelo Mahlobo"],
  ["Kagiso Mokwena", "Refilwe Motaung"],
  ["Simphiwe Hadebe", "Lerato Nkosi"],
  ["Mandla Khoza", "Ntombi Mahlangu"],
];

function slugifyEmail(name) {
  return name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
}

const ANSWER_TEXT =
  "SEED DATA — This is placeholder text generated for demo purposes to exercise the nomination-to-admin " +
  "review flow. It stands in for a real nominator's written response of a few hundred words, covering " +
  "specific examples, context and measurable outcomes relevant to this question.";

let pairIndex = 0;

async function seedNominations() {
  const batch = db.batch();
  let count = 0;

  CATEGORIES.forEach((category, catIdx) => {
    for (let n = 0; n < 2; n++) {
      const seedId = `seed-${category.id}-${n + 1}`;
      const [nomineeName, nominatorName] = NOMINEE_PAIRS[pairIndex % NOMINEE_PAIRS.length];
      pairIndex++;

      const isSelfNomination = n === 1 && catIdx === 0; // one example of a self-nomination
      const complete = n === 0; // first of each pair has all docs; second is left incomplete on purpose
      const department = DEPARTMENTS[(catIdx * 2 + n) % DEPARTMENTS.length];

      const nomineeEmail = `${slugifyEmail(nomineeName)}@dut.ac.za`;
      const nominatorEmail = isSelfNomination ? nomineeEmail : `${slugifyEmail(nominatorName)}@dut.ac.za`;

      const payload = {
        categoryId: category.id,
        categoryName: category.name,
        nomineeName,
        nomineeEmail,
        staffNumber: `2${(10000000 + catIdx * 111111 + n).toString().slice(0, 7)}`,
        department,
        nominatorName: isSelfNomination ? nomineeName : nominatorName,
        nominatorEmail,
        nominatorRelationship: isSelfNomination ? "Self-nomination" : RELATIONSHIPS[n % RELATIONSHIPS.length],
        isSelfNomination,
        eligibility: {
          workPeriod: true,
          notResubmitted: true,
          notMultiNominated: true,
        },
        answers: buildAnswers(category.questions, ANSWER_TEXT),
        uploads: buildUploads(category.id, seedId, category.questions, complete),
        status: "pending",
        isSeedData: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      batch.set(db.collection("nominations").doc(seedId), payload);
      count++;
      console.log(
        `📝 Queued ${seedId} — ${nomineeName} (${category.name}) — ${complete ? "all docs uploaded" : "docs intentionally missing"}`
      );
    }
  });

  await batch.commit();
  console.log(`\n✅ ${count} fake nominations written to Firestore.\n`);
}

async function main() {
  console.log("── Seeding admin + judge accounts ──────────────────────────\n");
  let usersOk = true;
  for (const u of SEED_USERS) {
    try {
      await seedUser(u);
    } catch (err) {
      usersOk = false;
      console.error(`❌ Could not create/update ${u.email}:`, err.code || err.message);
    }
  }
  if (!usersOk) {
    console.error(
      "\n⚠️  Firebase Authentication looks like it isn't enabled for this project yet " +
        "(Email/Password sign-in provider). Enable it in the Firebase console under " +
        "Authentication → Sign-in method, then re-run this script to create the accounts.\n"
    );
  }

  console.log("\n── Seeding fake nominations (2 per category) ───────────────\n");
  await seedNominations();

  console.log("── Done ─────────────────────────────────────────────────────");
  if (usersOk) {
    console.log(`\nLogin credentials (password is the same for both):`);
    console.log(`  Admin: ${SEED_USERS[0].email} / ${SEED_PASSWORD}`);
    console.log(`  Judge: ${SEED_USERS[1].email} / ${SEED_PASSWORD}`);
  }
  console.log(`\nAll seed nominations have isSeedData: true and ids starting with "seed-" for easy cleanup.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
