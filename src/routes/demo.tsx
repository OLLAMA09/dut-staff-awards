// /demo — Interactive sandbox for practising judge scoring (no Firestore writes)
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  BookOpen,
  AlertCircle,
  Medal,
  BarChart3,
  X,
  FileText,
  User,
  GraduationCap,
  Building2,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { getCriteriaForCategory, computeWeightedAverage, AWARD_CATEGORIES } from "@/data/awards";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "Demo Sandbox · Registrar's Ambit Staff Awards" },
      { name: "description", content: "Practice the judge rating flow with dummy nominees." },
    ],
  }),
});

// ─── Dummy nominees with realistic question answers ───────────────────────────

type DemoNominee = {
  id: string;
  name: string;
  staffNumber: string;
  department: string;
  position: string;
  category: string;
  categoryId: string;
  nominatorName: string;
  nominatorRelationship: string;
  /** Keyed by question id from AWARD_CATEGORIES */
  answers: Record<string, string>;
  /** Mock supporting documents */
  evidenceFiles?: Array<{
    name: string;
    label: string;
    type: "pdf" | "image" | "text";
  }>;
};

const DEMO_NOMINEES: DemoNominee[] = [
  {
    id: "demo-1",
    name: "Ayanda Khumalo",
    staffNumber: "21001234",
    department: "Student Enrolment Management",
    position: "Senior Enrolment Officer",
    category: "Living the Values Staff Award",
    categoryId: "living-values",
    nominatorName: "Prof. S. Govender",
    nominatorRelationship: "Manager / Supervisor",
    answers: {
      "lv-1":
        "Ayanda has consistently demonstrated Accountability, Respect, Integrity, Honesty and Transparency across three years in Enrolment Management. She takes ownership of every application in her queue, corrects errors proactively rather than waiting for escalation, and is known for giving students the same courteous, transparent explanation whether the news is good or bad.",
      "lv-2":
        "Ayanda redesigned the walk-in query process for prospective students, cutting average wait time from 45 to 12 minutes. The change has been adopted department-wide and continues to reduce complaint volumes eighteen months after implementation — a lasting, measurable improvement beyond her own desk.",
      "lv-3":
        "During the 2025 registration peak, Ayanda voluntarily covered two colleagues' queues during a staffing shortage without being asked, coordinating a fair workload split so no student was left waiting. Peer feedback consistently describes her as the person who keeps the team's shared goals on track.",
      "lv-4":
        "Ayanda mentors two junior enrolment officers informally, has volunteered to lead the unit's paperless-filing sustainability initiative, and was commended in her 2025 performance review for taking responsibility beyond her job description.",
    },
  },
  {
    id: "demo-2",
    name: "Sipho Ndlovu",
    staffNumber: "22005678",
    department: "Facilities & Campus Operations",
    position: "Operations Manager",
    category: "Best Performing Unit Award",
    categoryId: "best-performing-unit",
    nominatorName: "Coach T. Mthembu",
    nominatorRelationship: "Colleague",
    answers: {
      "bpu-1":
        "Sipho's unit rebuilt its annual operating plan directly around ENVISION2030 priorities, aligning maintenance scheduling and space utilisation reporting to the DUT Way's efficiency and sustainability goals, with quarterly reviews tracked against those targets.",
      "bpu-2":
        "The unit's average work-order turnaround time improved from 6 days to 2.5 days over the past year, verified through the internal facilities ticketing system and confirmed in the Q3 2025 service audit.",
      "bpu-3":
        "A campus-wide satisfaction survey showed a 22-point improvement in staff and student satisfaction with facilities responsiveness, directly attributable to the unit's new triage and prioritisation system.",
      "bpu-4":
        "The unit introduced a digital work-order and asset-tracking system replacing a paper-based process, reducing lost requests to near zero and giving management real-time visibility into outstanding jobs.",
      "bpu-5":
        "Sipho's unit has an unbroken record of clean internal audits and is frequently cited by other departments as a model of professionalism and responsiveness, per testimonials collected for this nomination.",
    },
  },
  {
    id: "demo-3",
    name: "Naledi Dube",
    staffNumber: "23009012",
    department: "Human Resources",
    position: "HR Business Partner",
    category: "Leadership & Mentorship Award",
    categoryId: "leadership-mentorship",
    nominatorName: "Ms. P. Pillay",
    nominatorRelationship: "HR",
    answers: {
      "lm-1":
        "Naledi has led the HR Business Partner function for the Registrar's Ambit with consistent integrity, including flagging and correcting a payroll discrepancy that could have disadvantaged twelve junior staff members, even though doing so added significant work to her own quarter.",
      "lm-2":
        "She formally mentors three junior HR administrators through structured monthly one-on-ones with documented development goals; two of her mentees have since been promoted within the division.",
      "lm-3":
        "Colleagues across departments credit Naledi with improving the tone and clarity of HR communications, and several have adopted her plain-language template for policy updates in their own units.",
      "lm-4":
        "Naledi designed and now runs a quarterly 'HR Foundations' workshop series aimed at developing future people-managers across the Registrar's Ambit, with 40 staff having completed the programme to date.",
      "lm-5":
        "Her leadership style — transparent, consistent and development-focused — was cited by name in this year's staff engagement survey as a reason respondents felt supported in their career growth.",
    },
  },
  {
    id: "demo-4",
    name: "Thandeka Mhlongo",
    staffNumber: "21003456",
    department: "Student Records & Academic Administration",
    position: "Records Officer",
    category: "Rising Star Staff Award",
    categoryId: "rising-star",
    nominatorName: "Dr. A. Nxumalo",
    nominatorRelationship: "Manager / Supervisor",
    answers: {
      "rs-1":
        "In her first two years, Thandeka rebuilt the academic records verification checklist, closing a data-integrity gap that had caused repeated transcript-reissue errors, and was formally commended in a letter from the Deputy Registrar.",
      "rs-2":
        "She independently identified and resolved a recurring bug in the records export process that had gone unnoticed for over a year, saving the team an estimated four hours of manual correction per week.",
      "rs-3":
        "Her streamlined transcript-request process was adopted university-wide after a successful pilot in her own unit, directly improving turnaround time for both students and alumni.",
      "rs-4":
        "Thandeka has completed two CPD-accredited records-management courses since joining and is currently enrolled in a part-time diploma in information management, fully self-funded.",
      "rs-5":
        "Her supervisor's report highlights her consistent honesty in escalating errors immediately rather than concealing them, directly reflecting DUT's value of transparency.",
    },
  },
  {
    id: "demo-5",
    name: "Lwazi Sithole",
    staffNumber: "22007890",
    department: "Registrar's Office & International Office",
    position: "Project Coordinator",
    category: "Best Collaboration Award",
    categoryId: "best-collaboration",
    nominatorName: "Ms. N. Zulu",
    nominatorRelationship: "Colleague",
    answers: {
      "bc-1":
        "Lwazi coordinated a joint project between the Registrar's Office and the International Office to digitise the credential-verification process for incoming international students, aligning two previously siloed workflows into one system.",
      "bc-2":
        "The two teams held weekly joint stand-ups throughout the six-month project, with shared documentation and a single point of accountability, which both team leads credit for the project finishing on schedule.",
      "bc-3":
        "The project required reconciling different data standards used by the Registrar's Office and the International Office, and Lwazi personally negotiated the shared data schema that both departments now use.",
      "bc-4":
        "International student credential-verification time dropped from an average of 11 working days to 3, with the joint process now documented as the standard operating procedure for both departments.",
    },
  },
  {
    id: "demo-6",
    name: "Zanele Mkhize",
    staffNumber: "24001122",
    department: "Registrar's Ambit — Central Administration",
    position: "Deputy Registrar's Assistant",
    category: "Outstanding Registrars Staff Award",
    categoryId: "outstanding-registrars",
    nominatorName: "Mr. K. Naidoo",
    nominatorRelationship: "Manager / Supervisor",
    answers: {
      "or-1":
        "Zanele routinely stays back after hours during peak registration periods to personally assist students who would otherwise miss enrolment deadlines, an effort documented in multiple unsolicited student thank-you emails.",
      "or-2":
        "She designed a simple visual queue-tracking board — since adopted by two other units — that gives students a clear, real-time sense of their place in the process, reducing anxiety and repeat queries.",
      "or-3":
        "A post-registration survey attributed a 15-point increase in student satisfaction with the registration experience directly to the queue-visibility initiative Zanele introduced.",
      "or-4":
        "Zanele coordinated directly with Student Finance and IT Services to resolve a cross-system data-sync issue that was blocking several hundred students from completing registration, resolving it within a single day through personal follow-up with both departments.",
    },
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoScore = {
  criteriaScores: Record<string, number>;
  comment: string;
  overallScore: number;
  submittedAt: Date;
};

// ─── Star picker ──────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;
  const label =
    value === 0 ? "No rating" :
    value === 1 ? "Poor" :
    value === 2 ? "Fair" :
    value === 3 ? "Good" :
    value === 4 ? "Very good" : "Exceptional";

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          className="transition-transform hover:scale-110 focus-visible:outline-none"
        >
          <Star
            className={`h-9 w-9 transition-colors ${
              star <= display ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-bold text-foreground">{label}</span>
    </div>
  );
}

// ─── Mini leaderboard ─────────────────────────────────────────────────────────

function MiniLeaderboard({ scores }: { scores: Record<string, DemoScore> }) {
  const ranked = useMemo(() =>
    DEMO_NOMINEES
      .map((n) => ({ ...n, score: scores[n.id]?.overallScore ?? 0, rated: !!scores[n.id] }))
      .filter((n) => n.rated)
      .sort((a, b) => b.score - a.score),
  [scores]);

  if (ranked.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Rate a nominee to see the leaderboard update in real time.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ranked.map((n, i) => {
        const rank = i + 1;
        const pct = (n.score / 5) * 100;
        const colours =
          rank === 1 ? { ring: "border-yellow-300/60 bg-yellow-50/60", bar: "bg-yellow-400", badge: "bg-yellow-400" } :
          rank === 2 ? { ring: "border-slate-300/50 bg-slate-50/50", bar: "bg-slate-400", badge: "bg-slate-300" } :
          rank === 3 ? { ring: "border-amber-500/30 bg-amber-50/40", bar: "bg-amber-600", badge: "bg-amber-600" } :
                      { ring: "border-primary/10 bg-white", bar: "bg-primary/50", badge: "" };
        return (
          <div key={n.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${colours.ring}`}>
            {rank <= 3 ? (
              <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full shadow ${colours.badge}`}>
                {rank === 1 ? <Trophy className="h-3.5 w-3.5 text-white" /> : <Medal className="h-3.5 w-3.5 text-white" />}
              </div>
            ) : (
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/20 bg-muted text-xs font-bold text-muted-foreground">{rank}</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{n.name}</p>
                <span className="shrink-0 text-sm font-bold">{n.score.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/5</span></span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div className={`h-full rounded-full transition-all ${colours.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{n.category}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Submission document viewer ───────────────────────────────────────────────

function SubmissionViewer({ nominee }: { nominee: DemoNominee }) {
  const catData = useMemo(
    () => AWARD_CATEGORIES.find((c) => c.id === nominee.categoryId),
    [nominee.categoryId],
  );

  // Group questions by section
  const sections = useMemo(() => {
    if (!catData) return [];
    const map = new Map<string, typeof catData.questions>();
    for (const q of catData.questions) {
      const list = map.get(q.section) ?? [];
      list.push(q);
      map.set(q.section, list);
    }
    return Array.from(map.entries());
  }, [catData]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Document header — mimics a real form header */}
      <div className="sticky top-0 z-10 border-b border-primary/15 bg-white/95 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
          <FileText className="h-3.5 w-3.5" />
          Nomination Submission · Registrar's Ambit Staff Awards
          <span className="ml-auto rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">Demo</span>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Nominee + nominator metadata */}
        <div className="rounded-xl border border-primary/15 bg-muted/20 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nominee</p>
                <p className="font-semibold text-foreground">{nominee.name}</p>
                <p className="text-xs text-muted-foreground">#{nominee.staffNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Position</p>
                <p className="font-semibold text-foreground">{nominee.position}</p>
                <p className="text-xs text-muted-foreground">{nominee.department}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</p>
                <p className="font-semibold text-foreground">{nominee.category}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nominated by</p>
                <p className="font-semibold text-foreground">{nominee.nominatorName}</p>
                <p className="text-xs text-muted-foreground">{nominee.nominatorRelationship}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Q&A sections */}
        {sections.map(([section, questions], si) => (
          <div key={section}>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {si + 1}
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">{section}</h3>
            </div>

            <div className="space-y-4 pl-8">
              {questions.map((q, qi) => {
                const answer = nominee.answers[q.id];
                return (
                  <div key={q.id} className="rounded-lg border border-primary/10 bg-white p-4 shadow-sm">
                    {/* Question prompt */}
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Q{qi + 1}{q.wordLimit ? ` · max ${q.wordLimit} words` : ""}
                    </p>
                    <p className="mb-3 text-sm font-medium text-foreground leading-snug">{q.prompt}</p>

                    {/* Evidence types expected */}
                    {q.evidence && q.evidence.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {q.evidence.map((e) => (
                          <span key={e} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] text-blue-700 font-medium">
                            <FileText className="h-2.5 w-2.5" /> {e}
                          </span>
                        ))}
                      </div>
                    )}

                    <Separator className="my-2" />

                    {/* Answer */}
                    {answer ? (
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{answer}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No written answer provided.</p>
                    )}
                  </div>
                );
              })}
            </div>

            {si < sections.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}

        {/* Supporting documents section */}
        {nominee.evidenceFiles && nominee.evidenceFiles.length > 0 && (
          <div className="rounded-lg border border-primary/15 bg-blue-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Supporting Documents</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {nominee.evidenceFiles.map((doc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    // Simple viewer - in real app, would open PDF viewer
                    alert(`📄 ${doc.label}\n\n${doc.name}\n\nType: ${doc.type.toUpperCase()}\n\nNote: This is a demo file. Full document viewer available in live judging interface.`);
                  }}
                  className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm transition-colors hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                >
                  <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{doc.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{doc.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-blue-700">
                    {doc.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!nominee.evidenceFiles || nominee.evidenceFiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-primary/20 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            No supporting documents attached.
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function DemoPage() {
  const [selected, setSelected] = useState<DemoNominee | null>(null);
  const [scores, setScores] = useState<Record<string, DemoScore>>({});
  const [criteriaInput, setCriteriaInput] = useState<Record<string, number>>({});
  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"nominees" | "leaderboard">("nominees");

  const criteria = selected ? getCriteriaForCategory(selected.categoryId) : [];
  const ratedCount = criteria.filter((c) => (criteriaInput[c.id] ?? 0) > 0).length;
  const overallPreview = computeWeightedAverage(criteriaInput, criteria);

  function openNominee(n: DemoNominee) {
    setSelected(n);
    setSavedId(null);
    const existing = scores[n.id];
    setCriteriaInput(existing?.criteriaScores ?? {});
    setCommentInput(existing?.comment ?? "");
  }

  function closeNominee() {
    setSelected(null);
    setSavedId(null);
  }

  async function submitScore() {
    if (!selected || ratedCount === 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const overall = computeWeightedAverage(criteriaInput, criteria);
    setScores((prev) => ({
      ...prev,
      [selected.id]: { criteriaScores: { ...criteriaInput }, comment: commentInput, overallScore: overall, submittedAt: new Date() },
    }));
    setSavedId(selected.id);
    setSaving(false);
  }

  function resetAll() {
    if (!confirm("Reset all demo scores? This clears your practice data.")) return;
    setScores({});
    setCriteriaInput({});
    setCommentInput("");
    setSelected(null);
    setSavedId(null);
  }

  const totalRated = Object.keys(scores).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gray-50 text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.02_260)_0%,transparent_60%)]" />
      <SiteNav />

      {/* Full-height layout when a nominee is open */}
      {selected ? (
        <div className="relative z-10 flex h-screen flex-col pt-[72px]">
          {/* Top bar */}
          <div className="flex items-center gap-3 border-b border-primary/15 bg-white/90 px-4 py-3 backdrop-blur">
            <button type="button" onClick={closeNominee} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
              <X className="h-4 w-4" /> All nominees
            </button>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-semibold text-foreground truncate">{selected.name}</span>
            <Badge variant="outline" className="ml-1 border-primary/20 text-[11px] text-primary">{selected.category}</Badge>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                <AlertCircle className="h-3 w-3" /> Demo
              </div>
              <Link to="/guide" className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary hover:bg-muted/30 transition">
                <BookOpen className="h-3 w-3" /> Guide
              </Link>
            </div>
          </div>

          {/* Two-panel layout — exactly like the real judge panel */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: submission document */}
            <aside className="hidden lg:flex flex-col flex-1 border-r border-primary/15 bg-white overflow-hidden">
              <div className="border-b border-primary/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Submission Document</p>
                <p className="text-[11px] text-muted-foreground">Question-by-question answers as submitted by the nominee.</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SubmissionViewer nominee={selected} />
              </div>
            </aside>

            {/* Right: scoring panel */}
            <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col overflow-hidden bg-gray-50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Mobile: submission toggle */}
                <details className="lg:hidden rounded-xl border border-primary/15 bg-white overflow-hidden">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4" /> View submission document
                  </summary>
                  <div className="max-h-[50vh] overflow-y-auto border-t border-primary/10">
                    <SubmissionViewer nominee={selected} />
                  </div>
                </details>

                {/* Scoring panel header */}
                <Card className="overflow-hidden">
                  <div className="border-b border-primary/10 bg-muted/20 px-5 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-bold text-foreground">
                        <MessageSquare className="h-4 w-4 text-primary" /> Your Evaluation
                      </p>
                      <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${overallPreview > 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Star className={`h-3.5 w-3.5 ${overallPreview > 0 ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        {overallPreview.toFixed(1)}/5
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {criteria.length} criteria for <span className="font-medium">{selected.category}</span> · {ratedCount}/{criteria.length} rated
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    {/* Per-criterion star pickers */}
                    {criteria.map((c, i) => (
                      <div
                        key={c.id}
                        className={`rounded-xl border p-4 transition ${(criteriaInput[c.id] ?? 0) > 0 ? "border-yellow-300/60 bg-yellow-50/40" : "border-primary/10 bg-gray-50"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Label className="block text-sm font-semibold text-foreground">
                              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
                              {c.label}
                            </Label>
                            {c.description && (
                              <p className="mt-0.5 ml-7 text-xs text-muted-foreground">{c.description}</p>
                            )}
                          </div>
                          {(criteriaInput[c.id] ?? 0) > 0 && (
                            <span className="shrink-0 text-xs font-bold text-yellow-600">{criteriaInput[c.id]}/5</span>
                          )}
                        </div>
                        <div className="mt-3">
                          <StarPicker
                            value={criteriaInput[c.id] ?? 0}
                            onChange={(v) => setCriteriaInput((prev) => ({ ...prev, [c.id]: v }))}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Comment */}
                    <div className="rounded-xl border border-primary/15 bg-blue-50/40 p-4">
                      <Label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Comments & Justification
                        <span className="ml-auto text-xs font-normal text-muted-foreground">{commentInput.length}/1000</span>
                      </Label>
                      <Textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value.slice(0, 1000))}
                        placeholder="Write your evaluation notes — strengths, concerns, reasoning for your ratings…"
                        rows={5}
                        className="resize-y bg-white"
                      />
                      <p className="mt-1.5 text-[11px] text-muted-foreground">Visible to admin only — not shown to nominees.</p>
                    </div>

                    {/* Submit */}
                    <Button
                      onClick={submitScore}
                      disabled={saving || ratedCount === 0}
                      className="w-full bg-primary text-primary-foreground disabled:opacity-50"
                      size="lg"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Saving…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          {scores[selected.id] ? "Update score" : "Submit score"}
                          {overallPreview > 0 && (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{overallPreview.toFixed(1)}/5</span>
                          )}
                        </span>
                      )}
                    </Button>

                    {ratedCount === 0 && (
                      <p className="text-center text-xs text-amber-600">Rate at least one criterion above to enable submission.</p>
                    )}

                    {savedId === selected.id && (
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <p className="text-sm font-semibold text-green-700">Score submitted!</p>
                        <p className="text-xs text-green-600">
                          Overall: {scores[selected.id]?.overallScore.toFixed(2)}/5
                        </p>
                        <div className="flex gap-2">
                          <button type="button" onClick={closeNominee} className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition">
                            Rate another
                          </button>
                          <button type="button" onClick={() => { closeNominee(); setTab("leaderboard"); }} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition">
                            View leaderboard
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── List / leaderboard view ── */
        <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Registrar's Ambit Staff Awards · Demo Sandbox</p>
            </div>
            <h1 className="text-4xl font-bold sm:text-5xl">
              Practice <span className="text-primary">Judge Scoring</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Test-drive the full judge panel with five realistic demo nominees. Read their complete nomination submissions, rate each criterion, and see your scores update live on the leaderboard. <strong className="text-foreground">All data stays in this sandbox — nothing is saved to Firestore.</strong>
            </p>

            {/* Features explanation */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Real Demo Data</p>
                  <p className="text-xs text-blue-700 mt-1">Complete nomination submissions with realistic answers copied from actual award submissions</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">No Firestore Persistence</p>
                  <p className="text-xs text-green-700 mt-1">All ratings and comments exist only in your browser. Close the page and they're gone</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <AlertCircle className="h-3.5 w-3.5" /> Sandbox mode active
              </div>
              <Badge variant="outline" className="border-green-300 text-green-700">{totalRated}/{DEMO_NOMINEES.length} nominees rated</Badge>
              {totalRated > 0 && (
                <button type="button" onClick={resetAll} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition">
                  <RotateCcw className="h-3 w-3" /> Clear all scores
                </button>
              )}
              <Link to="/guide" className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary hover:bg-muted/30 transition">
                <BookOpen className="h-3 w-3" /> Judge guide
              </Link>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="mb-6 flex overflow-hidden rounded-xl border border-primary/20 bg-muted/30 w-fit">
            {(["nominees", "leaderboard"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition capitalize ${tab === t ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "nominees" ? <><Star className="h-4 w-4" /> Rate Nominees</> : (
                  <><BarChart3 className="h-4 w-4" /> Leaderboard
                    {totalRated > 0 && <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">{totalRated}</span>}
                  </>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "nominees" ? (
              <motion.div key="nominees" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {DEMO_NOMINEES.map((n, i) => {
                    const scored = scores[n.id];
                    const cats = getCriteriaForCategory(n.categoryId);
                    return (
                      <motion.button key={n.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        type="button" onClick={() => openNominee(n)}
                        className="group text-left rounded-2xl border border-primary/20 bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          {scored ? (
                            <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                              <CheckCircle2 className="h-3 w-3" /> {scored.overallScore.toFixed(1)}/5
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Not rated</span>
                          )}
                          <span className="text-[11px] text-muted-foreground">{cats.length} criteria</span>
                        </div>
                        <h3 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors">{n.name}</h3>
                        <p className="mt-1 text-xs text-primary font-medium">{n.category}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{n.position} · {n.department}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Nominated by {n.nominatorName} ({n.nominatorRelationship})</p>
                        {scored ? (
                          <div className="mt-3 flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star key={si} className={`h-4 w-4 ${si < Math.round(scored.overallScore) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/20"}`} />
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Open submission <ChevronRight className="h-3 w-3" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div key="leaderboard" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="max-w-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-xl font-bold">Demo Leaderboard</h2>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 text-[11px]">Practice only</Badge>
                </div>
                <p className="mb-5 text-sm text-muted-foreground">Ranked by overall weighted score. In the real leaderboard, all judges' scores are summed.</p>
                <MiniLeaderboard scores={scores} />
                {totalRated < DEMO_NOMINEES.length && (
                  <div className="mt-6 rounded-xl border border-dashed border-primary/20 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                    {DEMO_NOMINEES.length - totalRated} nominee{DEMO_NOMINEES.length - totalRated !== 1 ? "s" : ""} still to rate.{" "}
                    <button type="button" onClick={() => setTab("nominees")} className="font-semibold text-primary hover:underline">Rate them →</button>
                  </div>
                )}
                {totalRated === DEMO_NOMINEES.length && (
                  <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                    <p className="font-bold text-green-800">All nominees rated!</p>
                    <p className="mt-1 text-xs text-green-600">You're ready for the real panel. <Link to="/judge" className="font-semibold underline">Go to Judge Panel →</Link></p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}
    </div>
  );
}
