// /nominate/$categoryId — Dedicated nomination page, decoupled from homepage
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Home,
  RotateCcw,
  CloudCheck,
  Clock,
  Info,
  BookOpen,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";
import { addDoc, collection, serverTimestamp, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNominationsOpen } from "@/lib/nomination-settings";
import { AWARD_CATEGORIES, ELIGIBILITY_QUESTIONS, type AwardCategory } from "@/data/awards";
import { useDraftForm } from "@/hooks/useDraftForm";
import { EvidenceUploader, type UploadedFile, type EvidenceUploads } from "@/components/EvidenceUploader";
import { validateDocumentsForCategory, getMissingDocumentsSummary } from "@/lib/document-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import SiteNav from "@/components/SiteNav";

// ─── Route definition ────────────────────────────────────────────────────────

export const Route = createFileRoute("/nominate/$categoryId")({
  component: NominatePage,
  head: ({ params }) => {
    const cat = AWARD_CATEGORIES.find((c) => c.id === params.categoryId);
    return {
      meta: [
        { title: cat ? `Nominate · ${cat.name} · Registrar's Ambit Staff Awards` : "Nominate · Registrar's Ambit Staff Awards" },
      ],
    };
  },
});

// ─── Constants ───────────────────────────────────────────────────────────────

const RELATIONSHIP_OPTIONS = [
  "Self-nomination",
  "Colleague",
  "Manager / Supervisor",
  "HR",
  "Other Staff Member",
];

const STEP_LABELS = ["Nominee Details", "Your Details", "Nomination Questions"];

const DEPARTMENT_GROUPS: { group: string; options: string[] }[] = [
  {
    group: "Executive Offices",
    options: [
      "Office of the Vice-Chancellor and Principal",
      "DVC: Teaching and Learning",
      "DVC: Research, Innovation and Engagement",
      "DVC: People and Operations",
      "Registrar's Division",
      "Office of the Chief Financial Officer (Finance Division)",
    ],
  },
  {
    group: "Registrar's Ambit",
    options: [
      "Academic Data and Student Records",
      "Committees Administration (Governance/Secretariat)",
      "Examinations",
      "Student Admissions",
      "Student Administration (Registration, Graduation Audits, Timetabling)",
    ],
  },
  {
    group: "Support & Professional Services",
    options: [
      "Human Capital Services (Human Resources)",
      "Finance Division (incl. Student Fees, Procurement/Supply Chain, Payroll)",
      "Information Technology and Support Services (ITSS)",
      "Corporate Affairs (Marketing, Communications, PR, Design Studio, Fundraising, Student Recruitment)",
      "Library and Information Services",
      "Centre for Excellence in Learning and Teaching (CELT)",
      "Centre for Quality Promotion and Assurance (CQPA)",
      "Institutional Planning, Monitoring and Evaluation",
      "Cooperative Education",
      "Research and Postgraduate Support",
      "International Education and Partnerships (IEP)",
      "Technology Transfer and Innovation",
      "Enterprise Development Unit",
      "Real Estate Management",
      "Physical Planning",
      "Logistics",
      "Printing",
      "Protection Services",
      "Midlands Campus Administration",
      "Writing Centre",
      "Online Distance Learning Office (ODL)",
      "Advancement and Alumni Relations",
      "Internal Audit",
      "Risk Management",
      "DUT Business School",
    ],
  },
  {
    group: "Student Services",
    options: [
      "Dean of Students Office",
      "Student Counselling and Health",
      "Student Financial Aid (Financial Aid Unit)",
      "Sports Administration",
      "Student Housing and Residence Life",
      "Student Governance and Development",
      "Disability Rights Unit",
    ],
  },
  {
    group: "Faculty of Accounting and Informatics",
    options: [
      "Faculty of Accounting and Informatics (Dean's Office)",
      "Auditing and Taxation",
      "Financial Accounting",
      "Management Accounting",
      "Information and Corporate Management",
      "Information Systems",
      "Information Technology",
      "Finance and Information Management (Midlands)",
    ],
  },
  {
    group: "Faculty of Applied Sciences",
    options: [
      "Faculty of Applied Sciences (Dean's Office)",
      "Biotechnology and Food Technology",
      "Chemistry",
      "Consumer Sciences (Food and Nutrition)",
      "Horticulture",
      "Maritime Studies",
      "Mathematics",
      "Physics",
      "Statistics",
      "Sport Studies",
    ],
  },
  {
    group: "Faculty of Arts and Design",
    options: [
      "Faculty of Arts and Design (Dean's Office)",
      "Drama and Production Studies",
      "Fashion and Textiles",
      "Fine Art and Jewellery Design",
      "Media, Language and Communication",
      "Visual Communication Design",
      "Video Technology",
      "Education and Humanities",
    ],
  },
  {
    group: "Faculty of Engineering and the Built Environment",
    options: [
      "Faculty of Engineering and the Built Environment (Dean's Office)",
      "Architecture",
      "Chemical Engineering",
      "Civil Engineering and Geomatics (Durban)",
      "Civil Engineering (Midlands)",
      "Construction Management and Quantity Surveying",
      "Electrical Power Engineering",
      "Electronic and Computer Engineering",
      "Industrial Engineering",
      "Mechanical Engineering",
      "Town and Regional Planning",
    ],
  },
  {
    group: "Faculty of Health Sciences",
    options: [
      "Faculty of Health Sciences (Dean's Office)",
      "Basic Medical Sciences",
      "Biomedical and Clinical Technology",
      "Chiropractic",
      "Community Health Studies",
      "Dental Sciences",
      "Emergency Medical Care and Rescue",
      "Homoeopathy",
      "Medical Orthotics and Prosthetics",
      "Nursing",
      "Radiography",
      "Somatology",
    ],
  },
  {
    group: "Faculty of Management Sciences",
    options: [
      "Faculty of Management Sciences (Dean's Office)",
      "Applied Law",
      "Ecotourism",
      "Entrepreneurial Studies and Management",
      "Hospitality and Tourism",
      "Human Resources Management",
      "Marketing and Retail",
      "Operations and Quality Management",
      "Public Management and Economics",
      "Public Relations Management",
    ],
  },
  {
    group: "Research Centres & Institutes",
    options: [
      "Institute for Water and Wastewater Technology (IWWT)",
      "Institute for Systems Science (ISS)",
      "Space Science Centre for Research and Postgraduate Studies",
      "Urban Futures Centre (UFC)",
      "International Centre of Nonviolence (ICON)",
      "Gender Justice, Health and Human Development",
      "Technology Stations (Food/Energy/Plastics)",
      "Confucius Institute",
    ],
  },
  {
    group: "Other",
    options: ["Other"],
  },
];

// ─── Department / Unit searchable combobox ────────────────────────────────────
// The search box lives directly on the field itself (not tucked inside a popup),
// so on mobile it's usable without opening a menu and scrolling to find it first.

function DepartmentCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const q = searchText.trim().toLowerCase();
  const filteredGroups = q
    ? DEPARTMENT_GROUPS.map(({ group, options }) => ({
        group,
        options: options.filter((d) => d.toLowerCase().includes(q)),
      })).filter(({ options }) => options.length > 0)
    : DEPARTMENT_GROUPS;

  function select(d: string) {
    onChange(d);
    setSearchText("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={open ? searchText : value}
          onFocus={() => {
            setOpen(true);
            setSearchText("");
          }}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!open) setOpen(true);
          }}
          placeholder="Search department / unit…"
          className="pl-9"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-[280px] w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filteredGroups.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No department found.</p>
          )}
          {filteredGroups.map(({ group, options }) => (
            <div key={group}>
              <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </p>
              {options.map((d) => (
                <button
                  type="button"
                  key={d}
                  onMouseDown={(e) => {
                    // Fire before the input's onBlur/outside-click handler closes the menu.
                    e.preventDefault();
                    select(d);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"
                >
                  <Check className={cn("h-4 w-4 shrink-0", value === d ? "opacity-100 text-primary" : "opacity-0")} />
                  <span className="truncate">{d}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Step = 1 | 2 | 3;

// ─── Page ────────────────────────────────────────────────────────────────────

function NominatePage() {
  const { categoryId } = Route.useParams();
  const navigate = useNavigate();

  const category = AWARD_CATEGORIES.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-lg text-muted-foreground">Award category not found.</p>
        <Button onClick={() => navigate({ to: "/", hash: "categories" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Awards
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 text-foreground">
      <SiteNav />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <NominationForm category={category} onBack={() => navigate({ to: "/", hash: "categories" })} />
      </main>
    </div>
  );
}

// ─── Form draft type ──────────────────────────────────────────────────────────

type FormDraft = {
  nominee: { name: string; staffNumber: string; email: string; department: string };
  nominator: { name: string; email: string; relationship: string };
  isSelfNomination: boolean;
  /** Eligibility checkbox answers keyed by ELIGIBILITY_QUESTIONS id */
  eligibility: Record<string, boolean>;
  answers: Record<string, string>;
  /** Uploaded evidence files: questionId → slotKey ("e0","e1",…) → files */
  uploads: Record<string, EvidenceUploads>;
  /** Stable ID used as the Firebase Storage path prefix for this submission attempt */
  sessionId: string;
};

// ─── Form draft factory ──────────────────────────────────────────────────────
// Must be a function (not a constant) so each form mount gets a fresh sessionId.
// Using the same sessionId across submissions would cause Storage path collisions.
function makeEmptyDraft(): FormDraft {
  return {
    nominee: { name: "", staffNumber: "", email: "", department: "" },
    nominator: { name: "", email: "", relationship: "" },
    isSelfNomination: false,
    eligibility: {},
    answers: {},
    uploads: {},
    sessionId: crypto.randomUUID(),
  };
}

// ─── Ensure Select fields don't render with empty value attribute ──────────────
// React 19 strict validation rejects empty strings on certain HTML attributes.
// When a Select value is "", Radix UI renders data-placeholder="" which is not allowed.
// Solution: Pass undefined to Select value when empty string, not the empty string itself.
function getSelectValue(value: string | undefined): string {
  // Always return a value for controlled components; Radix will handle placeholder mode
  // with empty string gracefully if we ensure aria attributes are clean
  return value ?? "";
}

// ─── Form orchestrator ────────────────────────────────────────────────────────

function NominationForm({ category, onBack }: { category: AwardCategory; onBack: () => void }) {
  const { open: nominationsOpen } = useNominationsOpen();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false);

  // Stable per-mount initial draft — fresh sessionId so Storage paths never collide.
  const [initialDraft] = useState<FormDraft>(makeEmptyDraft);

  // Autosave + versioning — scoped per category so drafts don't collide
  const { draft, setDraft, undo, clearDraft, canUndo, snapshotCount, status, lastSaved, hasDraft } =
    useDraftForm<FormDraft>(`raa-draft-${category.id}`, initialDraft);

  const { nominee, nominator, isSelfNomination = false, eligibility = {}, answers, uploads = {} } = draft;
  // Old drafts (saved before sessionId was added) won't have the field.
  // Fall back to this mount's fresh UUID so the storage path is never "undefined".
  const sessionId = draft.sessionId ?? initialDraft.sessionId;

  // Count total files in a restored draft to surface in the banner
  const restoredFileCount = hasDraft
    ? Object.values(uploads)
        .flatMap((slots) => Object.values(slots))
        .flat().length
    : 0;

  // Handle hash-based navigation (e.g., #documents jumps directly to upload section)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#documents") {
      setStep(3);
      // Scroll to documents section after a brief delay for render
      setTimeout(() => {
        const docsSection = document.getElementById("documents-section");
        if (docsSection) {
          docsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  // Group questions by section for display
  const sections = category.questions.reduce<Record<string, typeof category.questions>>(
    (acc, q) => {
      if (!acc[q.section]) acc[q.section] = [];
      acc[q.section].push(q);
      return acc;
    },
    {}
  );

  function validateStep1() {
    return (
      nominee.name.trim() &&
      nominee.staffNumber.trim() &&
      nominee.email.trim() &&
      nominee.department.trim() &&
      ELIGIBILITY_QUESTIONS.every((q) => eligibility[q.id])
    );
  }

  function validateStep2() {
    return nominator.name.trim() && nominator.email.trim() && nominator.relationship;
  }

  function validateStep3() {
    return category.questions.every((q) => (answers[q.id] ?? "").trim().length > 0);
  }

  function validateDocuments() {
    const validation = validateDocumentsForCategory(category.id, uploads);
    // Debug logging when validation fails
    if (!validation.isValid) {
      console.log('📋 [Form] Validation FAILED. Current state:', {
        categoryId: category.id,
        uploadKeys: Object.keys(uploads),
        uploadsStructure: uploads,
        questions: category.questions.map(q => ({
          id: q.id,
          evidence: q.evidence,
          hasUploads: uploads[q.id] ? Object.keys(uploads[q.id]).length > 0 : false,
        })),
        validation,
      });
    }
    return validation;
  }

  function areAllDocumentsComplete() {
    const validation = validateDocuments();
    return validation.isValid;
  }

  function nextStep() {
    setError("");
    if (step === 1 && !validateStep1()) {
      setError("Please complete all fields before continuing.");
      return;
    }
    if (step === 2 && !validateStep2()) {
      setError("Please complete all fields before continuing.");
      return;
    }
    // Skip email-uniqueness check for self-nominations (same person, same email)
    if (
      step === 2 &&
      !isSelfNomination &&
      nominator.email.trim().toLowerCase() === nominee.email.trim().toLowerCase()
    ) {
      setError("Your email address cannot be the same as the nominee's email address.");
      return;
    }
    setStep((s) => (s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevStep() {
    setError("");
    setStep((s) => (s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Recursively remove undefined values from an object.
   * Firestore doesn't support undefined values, so we need to clean them before saving.
   */
  function cleanPayload<T extends Record<string, any>>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => cleanPayload(item)) as any;
    }
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = typeof value === 'object' ? cleanPayload(value) : value;
      }
    }
    return cleaned;
  }

  async function submit() {
    setError("");
    
    // Check if nomination period is closed
    if (!nominationsOpen) {
      setError("The nomination period has closed and no new nominations are being accepted.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    if (!validateStep3()) {
      setError("Please answer all questions before submitting.");
      return;
    }
    
    // Validate that all required documents are uploaded
    const docValidation = validateDocuments();
    if (!docValidation.isValid) {
      setError(`Please upload all required documents before submitting. Missing: ${docValidation.missingDocuments.join(", ")}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Check payload size (Firestore has 1MB limit per document)
    const payload = {
      categoryId: category.id,
      categoryName: category.name,
      nomineeName: nominee.name.trim(),
      nomineeEmail: nominee.email.trim(),
      staffNumber: nominee.staffNumber.trim(),
      department: nominee.department.trim(),
      nominatorName: nominator.name.trim(),
      nominatorEmail: nominator.email.trim(),
      nominatorRelationship: nominator.relationship,
      isSelfNomination,
      eligibility,
      answers,
      uploads,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Clean payload of undefined values before saving to Firestore
    const cleanedPayload = cleanPayload(payload);
    
    const payloadStr = JSON.stringify(cleanedPayload);
    const payloadBytes = new Blob([payloadStr]).size;
    const payloadMB = (payloadBytes / (1024 * 1024)).toFixed(2);
    
    console.log('📊 [Submit] Payload size:', {
      bytes: payloadBytes,
      megabytes: payloadMB,
      limit: '1.0 MB',
      exceeds: payloadBytes > 1024 * 1024,
    });
    
    if (payloadBytes > 1024 * 1024) {
      setError(`Submission too large (${payloadMB} MB). The submission exceeds the 1 MB limit. Try uploading fewer or smaller files.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setLoading(true);
    try {
      console.log('📤 [Submit] Preparing submission:', {
        categoryId: category.id,
        nomineeName: nominee.name.trim(),
        nomineeEmail: nominee.email.trim(),
        staffNumber: nominee.staffNumber.trim(),
        department: nominee.department,
        nominatorName: nominator.name.trim(),
        nominatorEmail: nominator.email.trim(),
        nominatorRelationship: nominator.relationship,
        isSelfNomination,
        answersCount: Object.keys(answers).length,
        questionsAnswered: Object.keys(answers),
        uploadsStructure: Object.keys(uploads),
        uploadTotals: Object.fromEntries(
          Object.entries(uploads).map(([qId, slots]) => [
            qId,
            Object.fromEntries(
              Object.entries(slots).map(([slotKey, files]: any) => [slotKey, Array.isArray(files) ? files.length : 0])
            ),
          ])
        ),
      });

      // Check for existing nomination for this nominee + category
      const existingQuery = query(
        collection(db, "nominations"),
        where("nomineeEmail", "==", nominee.email.trim().toLowerCase()),
        where("categoryId", "==", category.id)
      );
      
      const existingResults = await getDocs(existingQuery);
      let docRef;
      let isUpdate = false;

      if (existingResults.size > 0) {
        // Update existing nomination (use first match)
        const existingDoc = existingResults.docs[0];
        docRef = existingDoc.ref;
        
        // Add updatedAt timestamp to track the merge
        const updatePayload = {
          ...cleanedPayload,
          updatedAt: serverTimestamp(),
          mergedAt: serverTimestamp(), // Track when nomination was merged/updated
          previousSubmissionId: existingDoc.id, // Track the previous version
        };
        
        await updateDoc(docRef, updatePayload);
        isUpdate = true;
        
        console.log('🔄 [Submit] MERGED! Updated existing nomination:', {
          docId: existingDoc.id,
          timestamp: new Date().toISOString(),
          action: 'update',
          nomineeName: nominee.name.trim(),
          nomineeEmail: nominee.email.trim(),
          categoryId: category.id,
        });
      } else {
        // Create new nomination
        docRef = await addDoc(collection(db, "nominations"), cleanedPayload);
        
        console.log('✅ [Submit] SUCCESS! Document created:', {
          docId: docRef.id,
          timestamp: new Date().toISOString(),
          action: 'create',
          nomineeName: nominee.name.trim(),
          nomineeEmail: nominee.email.trim(),
          categoryId: category.id,
        });
      }

      clearDraft(); // wipe the saved draft on success
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('❌ [Submit] FAILED!', {
        error: errorMsg,
        errorStack,
        errorType: error?.constructor?.name,
        errorDetails: error,
        nomineeEmail: nominee.email.trim(),
        categoryId: category.id,
      });
      
      // Provide more specific error messages based on error type
      if (errorMsg.includes('permission')) {
        setError('Permission denied. Your nomination cannot be submitted. Contact support if this persists.');
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMsg.includes('quota')) {
        setError('Database quota exceeded. Please try again later.');
      } else {
        setError(`Submission failed: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return <SuccessScreen categoryName={category.name} onBack={onBack} />;
  }

  // Check if nomination period is closed
  const periodClosed = !nominationsOpen;

  if (periodClosed) {
    return (
      <div>
        {/* Breadcrumb */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Award Categories
        </button>

        {/* Nomination period closed message */}
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 px-8 py-12 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-200">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-red-900 mb-2">
                Nomination Period Has Closed
              </h2>
              <p className="text-red-800 mb-4">
                Thank you for your interest! Nominations for the Registrar's Ambit Staff Awards are currently closed.
                No new nominations are being accepted at this time.
              </p>
              <p className="text-red-700 text-sm mt-4">
                If you believe this is an error or have questions, please contact the awards team.
              </p>
              <Button
                onClick={onBack}
                className="mt-6 bg-red-600 hover:bg-red-700 text-white"
              >
                Return to Awards
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Award Categories
      </button>

      {/* Page header — white card */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{category.short ?? category.id}</p>
        <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{category.name}</h1>
        <p className="mt-2 text-gray-500">{category.tagline}</p>
      </div>

      {/* Draft restored banner */}
      {hasDraft && !draftBannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm shadow-sm"
        >
          <span className="text-foreground">
            <span className="font-medium">Draft restored.</span>{" "}
            <span className="text-muted-foreground">
              Your previous progress has been loaded
              {restoredFileCount > 0 && (
                <> — including <span className="font-medium text-primary">{restoredFileCount} uploaded {restoredFileCount === 1 ? "file" : "files"}</span></>
              )}.
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { clearDraft(); setDraftBannerDismissed(true); }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Start fresh
            </button>
            <button
              onClick={() => setDraftBannerDismissed(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Continue ›
            </button>
          </div>
        </motion.div>
      )}

      {/* Step progress — white card */}
      <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex gap-4">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors duration-300 ${
                  step > s ? "bg-primary" : step === s ? "bg-primary/60" : "bg-gray-200"
                }`}
              />
              <p
                className={`mt-2 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  step === s ? "text-primary" : step > s ? "text-gray-400" : "text-gray-300"
                }`}
              >
                {STEP_LABELS[s - 1]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Autosave status bar */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs text-gray-500 shadow-sm">
        <span className="flex items-center gap-1.5">
          {status === "saving" && (
            <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
          )}
          {status === "saved" && lastSaved && (
            <><CloudCheck className="h-3 w-3 text-primary" /> Draft saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
          )}
          {status === "idle" && !lastSaved && (
            <><Clock className="h-3 w-3" /> Changes autosave as you type</>
          )}
        </span>
        {canUndo && (
          <button
            onClick={undo}
            className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs text-primary transition hover:bg-primary/15"
          >
            <RotateCcw className="h-3 w-3" /> Undo
            {snapshotCount > 1 && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] leading-none">
                {snapshotCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Contextual guide — shown on step 1 for everyone, updated on step 2 for self-nominees */}
        {(step === 1 || step === 2) && (
          <NominationGuide isSelfNomination={step === 2 && isSelfNomination} />
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepNominee
              key="s1"
              nominee={nominee}
              onChange={(n) => setDraft((prev) => ({ ...prev, nominee: n }))}
              eligibility={eligibility}
              onEligibilityChange={(e) => setDraft((prev) => ({ ...prev, eligibility: e }))}
            />
          )}
          {step === 2 && (
            <StepNominator
              key="s2"
              nominator={nominator}
              nominee={nominee}
              isSelfNomination={isSelfNomination}
              onSelfNominationChange={(v) => {
                if (v) {
                  // Auto-fill nominator fields from nominee and force relationship
                  setDraft((prev) => ({
                    ...prev,
                    isSelfNomination: true,
                    nominator: {
                      name: prev.nominee.name,
                      email: prev.nominee.email,
                      relationship: "Self-nomination",
                    },
                  }));
                } else {
                  setDraft((prev) => ({ ...prev, isSelfNomination: false }));
                }
              }}
              onChange={(n) => setDraft((prev) => ({ ...prev, nominator: n }))}
            />
          )}
          {step === 3 && (
            <StepQuestions
              key="s3"
              sections={sections}
              answers={answers}
              onAnswersChange={(a) => setDraft((prev) => ({ ...prev, answers: a }))}
              uploads={uploads}
              onUploadsChange={(u) => setDraft((prev) => ({ ...prev, uploads: u }))}
              storagePath={`nominations/${category.id}/${sessionId}`}
            />
          )}
        </AnimatePresence>

        {/* Document validation status on step 3 */}
        {step === 3 && (
          <div id="documents-section">
            {!areAllDocumentsComplete() && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">
                      Supporting documents still needed
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      {(() => {
                        const count = validateDocuments().missingItems.length;
                        return `${count} question${count !== 1 ? "s" : ""} below ${count !== 1 ? "are" : "is"} missing evidence. Upload the files listed, then this checklist will clear on its own.`;
                      })()}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {validateDocuments().missingItems.map((item) => (
                    <li
                      key={item.questionId}
                      className="rounded-md border border-amber-200 bg-white/60 px-3 py-2.5"
                    >
                      <p className="text-xs font-medium leading-snug text-amber-900">
                        {item.questionPrompt}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {item.missingEvidence.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                          >
                            {label}
                          </span>
                        ))}
                        <a
                          href={`#question-${item.questionId}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document
                              .getElementById(`question-${item.questionId}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="ml-auto text-[11px] font-semibold text-primary hover:underline"
                        >
                          Upload now →
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
            {areAllDocumentsComplete() && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <p className="font-semibold text-green-900">
                  ✓ All required documents uploaded
                </p>
              </motion.div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep} disabled={loading} className="border-primary/30">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={nextStep} className="bg-primary text-primary-foreground">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={submit} 
              disabled={loading || !areAllDocumentsComplete()} 
              className="bg-primary text-primary-foreground min-w-[180px]"
              title={!areAllDocumentsComplete() ? "Please upload all required documents before submitting" : undefined}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : !areAllDocumentsComplete() ? (
                <>
                  📎 Complete Documents Required
                </>
              ) : (
                "Submit Nomination"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Nomination quick-guide tip card ─────────────────────────────────────────

function NominationGuide({ isSelfNomination }: { isSelfNomination: boolean }) {
  const [open, setOpen] = useState(false);

  const nomSteps = [
    { num: 1, title: "Nominee details (Step 1)", body: "Enter the staff member's full name, staff number, DUT email address, department/unit, and confirm the eligibility questions. All fields are required and will be verified by the admin team." },
    { num: 2, title: "Your details as nominator (Step 2)", body: "Tell us who you are and your relationship to the nominee (peer, lecturer, coach, etc.). If you are nominating yourself, tick the 'I am nominating myself' checkbox — your details will be filled in automatically." },
    { num: 3, title: "Answer the evaluation questions (Step 3)", body: "Each award category has specific questions. Answer them honestly and in detail. Where the question asks for evidence (transcripts, letters, photos), upload the files using the upload button next to that question." },
    { num: 4, title: "Upload supporting evidence", body: "You can upload PDFs, Word docs, images and more. Files are stored securely and are only visible to the admin team and shortlisting judges. Maximum 10 MB per file." },
    { num: 5, title: "Submit", body: "Click Submit on Step 3. You will see a confirmation screen. Your draft is automatically saved as you type — if you close the page and return, your progress will be restored." },
  ];

  const selfSteps = [
    { num: 1, title: "Tick 'I am nominating myself'", body: "On Step 2 (Your Details), tick the checkbox. Your name and email from Step 1 will be copied across automatically — no double-entry needed." },
    { num: 2, title: "Your relationship is recorded as 'Self-nomination'", body: "This is perfectly allowed and encouraged when supported by a strong Portfolio of Evidence. Admin can see that the nomination is self-submitted." },
    { num: 3, title: "Answer honestly and with evidence", body: "Self-nominations are evaluated on the same criteria as other nominations. Strong evidence — transcripts, letters of support, event reports — significantly strengthens your submission." },
    { num: 4, title: "Get a supporting letter", body: "While not required, a letter from a lecturer, coach or community leader confirming your achievements can make your self-nomination much more competitive." },
  ];

  const steps = isSelfNomination ? selfSteps : nomSteps;
  const title = isSelfNomination ? "Self-nomination guide — what to expect" : "How to complete this nomination — Quick Guide";
  const storageKey = isSelfNomination ? "selfNomGuideOpen" : "nominatorGuideOpen";

  return (
    <div className={`rounded-xl border overflow-hidden mb-5 ${isSelfNomination ? "border-blue-200 bg-blue-50/40" : "border-primary/15 bg-muted/20"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/5 transition"
      >
        <Info className={`h-4 w-4 shrink-0 ${isSelfNomination ? "text-blue-600" : "text-primary"}`} />
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-primary/10 px-4 py-4 space-y-3 bg-white/60">
          {steps.map((step) => (
            <div key={step.num} className="flex gap-3">
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5 ${isSelfNomination ? "bg-blue-500" : "bg-primary"}`}>
                {step.num}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-primary/10">
            <Link to="/guide" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <BookOpen className="h-3 w-3" /> View full user guide →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Nominee Details ──────────────────────────────────────────────────

function StepNominee({
  nominee,
  onChange,
  eligibility,
  onEligibilityChange,
}: {
  nominee: { name: string; staffNumber: string; email: string; department: string };
  onChange: (v: typeof nominee) => void;
  eligibility: Record<string, boolean>;
  onEligibilityChange: (v: Record<string, boolean>) => void;
}) {
  const set = (k: keyof typeof nominee, v: string) => onChange({ ...nominee, [k]: v });
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold">About the Nominee</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about the staff member you're nominating.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name *">
          <Input
            value={nominee.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Thandeka Mhlongo"
          />
        </Field>
        <Field label="Staff Number *">
          <Input
            value={nominee.staffNumber}
            onChange={(e) => set("staffNumber", e.target.value)}
            placeholder="e.g. 21234567"
          />
        </Field>
      </div>
      <Field label="Staff Email Address *">
        <Input
          type="email"
          value={nominee.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="e.g. thandeka@dut.ac.za"
        />
      </Field>
      <Field label="Department / Unit *">
        <DepartmentCombobox value={nominee.department} onChange={(v) => set("department", v)} />
      </Field>

      <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-foreground">Eligibility *</p>
        {ELIGIBILITY_QUESTIONS.map((q) => (
          <div key={q.id} className="flex items-start gap-3">
            <Checkbox
              id={q.id}
              checked={!!eligibility[q.id]}
              onCheckedChange={(checked) =>
                onEligibilityChange({ ...eligibility, [q.id]: !!checked })
              }
              className="mt-0.5 shrink-0"
            />
            <label htmlFor={q.id} className="cursor-pointer text-sm text-muted-foreground">
              {q.label}
            </label>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Step 2: Nominator Details ────────────────────────────────────────────────

function StepNominator({
  nominator,
  nominee,
  isSelfNomination,
  onSelfNominationChange,
  onChange,
}: {
  nominator: { name: string; email: string; relationship: string };
  nominee: { name: string; email: string; staffNumber: string; department: string };
  isSelfNomination: boolean;
  onSelfNominationChange: (v: boolean) => void;
  onChange: (v: typeof nominator) => void;
}) {
  const set = (k: keyof typeof nominator, v: string) => onChange({ ...nominator, [k]: v });
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold">About You</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about yourself — the person submitting this nomination.
        </p>
      </div>

      {/* Self-nomination checkbox */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <Checkbox
          id="self-nom"
          checked={isSelfNomination}
          onCheckedChange={(checked) => onSelfNominationChange(!!checked)}
          className="mt-0.5 shrink-0"
        />
        <div>
          <label htmlFor="self-nom" className="cursor-pointer text-sm font-semibold text-foreground">
            I am nominating myself
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tick this box to auto-fill your details from the nominee information and mark this as a
            self-nomination. Self-nominations are reviewed separately by admin.
          </p>
        </div>
      </div>

      <Field label="Your Full Name *">
        <Input
          value={nominator.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Sipho Dlamini"
          readOnly={isSelfNomination}
          className={isSelfNomination ? "bg-muted/50" : ""}
        />
      </Field>
      <Field label="Your Email Address *">
        <Input
          type="email"
          value={nominator.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="e.g. sipho@dut.ac.za"
          readOnly={isSelfNomination}
          className={isSelfNomination ? "bg-muted/50" : ""}
        />
      </Field>
      <Field label="Your Relationship to the Nominee *">
        <Select
          value={nominator.relationship}
          onValueChange={(v) => set("relationship", v)}
          disabled={isSelfNomination}
        >
          <SelectTrigger className={isSelfNomination ? "bg-muted/50" : ""}>
            <SelectValue placeholder="Select relationship" />
          </SelectTrigger>
          <SelectContent>
            {RELATIONSHIP_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {!isSelfNomination && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Self-nominations are welcome.</strong> Tick the
            checkbox above if you are nominating yourself.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Step 3: Category Questions ───────────────────────────────────────────────

function StepQuestions({
  sections,
  answers,
  onAnswersChange,
  uploads,
  onUploadsChange,
  storagePath,
}: {
  sections: Record<string, { id: string; section: string; prompt: string; wordLimit?: number; evidence?: string[] }[]>;
  answers: Record<string, string>;
  onAnswersChange: (a: Record<string, string>) => void;
  uploads: Record<string, EvidenceUploads>;
  onUploadsChange: (u: Record<string, EvidenceUploads>) => void;
  storagePath: string;
}) {
  function countWords(text: string) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-10"
    >
      <div>
        <h2 className="text-xl font-bold">Nomination Questions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer all questions below. Where a word limit applies, it is shown on the field.
        </p>
      </div>

      {Object.entries(sections).map(([section, questions]) => (
        <div key={section}>
          {/* Section divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-primary/20" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              {section}
            </p>
            <div className="h-px flex-1 bg-primary/20" />
          </div>

          <div className="space-y-7">
            {questions.map((q) => {
              const words = countWords(answers[q.id] ?? "");
              const overLimit = q.wordLimit ? words > q.wordLimit : false;
              return (
                <div key={q.id} id={`question-${q.id}`} className="space-y-2 scroll-mt-24">
                  <Label className="text-sm font-medium leading-snug">{q.prompt}</Label>
                  {q.wordLimit && (
                    <p className="text-xs text-muted-foreground">Word limit: {q.wordLimit} words</p>
                  )}
                  <Textarea
                    rows={5}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswersChange({ ...answers, [q.id]: e.target.value })}
                    className={`resize-none ${overLimit ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    placeholder="Enter your response here…"
                  />
                  {q.wordLimit && (
                    <p
                      className={`text-right text-xs ${overLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}
                    >
                      {words} / {q.wordLimit} words
                    </p>
                  )}
                  {q.evidence && q.evidence.length > 0 && (
                    <EvidenceUploader
                      basePath={`${storagePath}/${q.id}`}
                      evidenceLabels={q.evidence}
                      files={uploads[q.id] ?? {}}
                      onFilesChange={(ev) =>
                        onUploadsChange({ ...uploads, [q.id]: ev })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ categoryName, onBack }: { categoryName: string; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center py-16 text-center"
    >
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-primary shadow-elegant">
        <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
      </div>
      <h2 className="text-3xl font-bold">Nomination Submitted!</h2>
      <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
        Your nomination for the{" "}
        <strong className="text-foreground">{categoryName}</strong> has been received. The Awards
        Committee will review all submissions and contact shortlisted candidates directly.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Thank you for recognising excellence at DUT.
      </p>
      <Button onClick={onBack} className="mt-10 bg-primary text-primary-foreground gap-2">
        <Home className="h-4 w-4" /> Back to Award Categories
      </Button>
    </motion.div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
