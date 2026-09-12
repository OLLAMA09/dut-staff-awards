import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Fragment,
  lazy,
  Suspense,
  useState,
  useRef,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Award,
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Heart,
  ChevronDown,
  ShieldCheck,
  Star,
  Loader,
  AlertCircle,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import EventProgram from "@/components/EventProgram";
import { RouteTransitionLoader } from "@/components/RouteTransitionLoader";
import { useNominationsOpen } from "@/lib/nomination-settings";
import { AWARD_CATEGORIES, AWARD_THEME } from "@/data/awards";

const AwardScene = lazy(() => import("@/components/AwardScene"));
const BackgroundScene = lazy(() => import("@/components/BackgroundScene"));
const PhotoBackdrop = lazy(() => import("@/components/PhotoBackdrop"));

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Registrar's Ambit Staff Awards" },
      {
        name: "description",
        content:
          "Registrar's Ambit Staff Awards: Recognising Excellence. Celebrating Service. Honouring Our People. Submit nominations for outstanding DUT staff.",
      },
      { property: "og:title", content: "Registrar's Ambit Staff Awards" },
      {
        property: "og:description",
        content: "Recognising Excellence. Celebrating Service. Honouring Our People.",
      },
    ],
  }),
});

const CATEGORY_ICONS: Record<string, typeof Award> = {
  "living-values": ShieldCheck,
  "best-performing-unit": Trophy,
  "leadership-mentorship": Users,
  "rising-star": Sparkles,
  "best-collaboration": Heart,
  "outstanding-registrars": Award,
};

const stats = [
  { num: "1", label: "Premier Event" },
  { num: "6", label: "Categories" },
  { num: "2026", label: "Year" },
];

/** Premium, expo-style ease used across reveal animations for a consistent, deliberate feel. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const headingGroup = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025, delayChildren: 0.15 } },
};
const headingChar = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

type RippleDot = { id: number; x: number; y: number; size: number };

/** Click/tap ripple feedback — a small material-style micro-animation for buttons. */
function useRipple(color: "light" | "dark" = "light") {
  const [ripples, setRipples] = useState<RippleDot[]>([]);

  const onPointerDown = (e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now() + Math.random();
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
    window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
  };

  const rippleSpans = (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ opacity: 0.35, scale: 0 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`absolute rounded-full ${color === "light" ? "bg-white/70" : "bg-primary/25"}`}
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </span>
  );

  return { onPointerDown, rippleSpans };
}

/** Sections tracked by the side scroll-spy navigator, in page order. */
const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "access", label: "Access" },
  { id: "about", label: "About" },
  { id: "categories", label: "Categories" },
  { id: "event", label: "Event" },
  { id: "program", label: "Programme" },
] as const;

function Index() {
  const { open: nominationsOpen } = useNominationsOpen();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nominatingId, setNominatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const blobY1 = useTransform(heroProgress, [0, 1], [0, 160]);
  const blobY2 = useTransform(heroProgress, [0, 1], [0, -130]);
  const blobY3 = useTransform(heroProgress, [0, 1], [0, 90]);
  const heroContentOpacity = useTransform(heroProgress, [0, 0.75], [1, 0]);
  const heroContentScale = useTransform(heroProgress, [0, 1], [1, 0.88]);
  const heroContentY = useTransform(heroProgress, [0, 1], [0, -60]);

  /** Page-wide scroll progress — drives our own blue scroll indicator (native scrollbar stays hidden). */
  const { scrollYProgress: pageProgress } = useScroll();

  // Scroll-spy: tracks which section is centred in view for the side nav.
  const [activeSection, setActiveSection] = useState<string>("hero");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleNominate = async (categoryId: string) => {
    setNominatingId(categoryId);
    await new Promise((resolve) => setTimeout(resolve, 300));
    navigate({ to: "/nominate/$categoryId", params: { categoryId } });
  };

  const nominateRipple = useRipple("light");
  const winnersRipple = useRipple("dark");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hero text-foreground">
      <RouteTransitionLoader />

      {/* Custom blue scroll-progress indicator — the native scrollbar stays hidden */}
      <div className="pointer-events-none fixed right-1 top-24 bottom-6 z-[60] w-1 rounded-full bg-blue-500/15">
        <motion.div
          style={{ scaleY: pageProgress }}
          className="h-full w-full origin-top rounded-full bg-blue-500"
          initial={false}
        />
      </div>

      {/* Section scroll-spy nav — desktop only, labels stay hidden until active/hovered */}
      <nav className="fixed right-4 top-1/2 z-[60] hidden -translate-y-1/2 flex-col items-end gap-4 lg:flex">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(s.id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group flex items-center gap-2.5"
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 ${
                  isActive
                    ? "translate-x-0 text-primary opacity-100"
                    : "translate-x-1 text-primary/60 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {s.label}
              </span>
              <span
                className={`shrink-0 rounded-full transition-all duration-200 ${
                  isActive
                    ? "h-2.5 w-2.5 bg-primary"
                    : "h-1.5 w-1.5 bg-primary/25 group-hover:bg-primary/60"
                }`}
              />
            </a>
          );
        })}
      </nav>

      <SiteNav />

      {/* Hero */}
      <section
        ref={heroRef}
        id="hero"
        className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
      >
        {/* Liquid background blobs — parallax on scroll */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div style={{ y: blobY1 }} className="absolute -top-16 -left-20">
            <div className="h-64 w-64 rounded-full bg-primary/25 blur-3xl animate-float" />
          </motion.div>
          <motion.div style={{ y: blobY2 }} className="absolute top-24 -right-16">
            <div className="h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-float-slower" />
          </motion.div>
          <motion.div style={{ y: blobY3 }} className="absolute top-72 left-1/3">
            <div className="h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-float" />
          </motion.div>
        </div>

        <motion.div
          style={{ opacity: heroContentOpacity, scale: heroContentScale, y: heroContentY }}
          className="relative mx-auto max-w-xl px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-primary">
              <motion.span
                animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.15, 1] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                  ease: "easeInOut",
                }}
                className="inline-flex"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              {AWARD_THEME.recognitionPeriod}
            </span>

            <motion.h1
              variants={headingGroup}
              initial="hidden"
              animate="show"
              className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
            >
              {AWARD_THEME.yearsBadge.split(" ").map((word, wi, words) => (
                <Fragment key={wi}>
                  <span className="inline-block whitespace-nowrap">
                    {word.split("").map((char, ci) => (
                      <motion.span key={ci} variants={headingChar} className="inline-block">
                        {char}
                      </motion.span>
                    ))}
                  </span>
                  {wi < words.length - 1 ? " " : ""}
                </Fragment>
              ))}
            </motion.h1>
            <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-muted-foreground sm:text-lg">
              Recognising Excellence. Celebrating Service. Honouring Our People.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/" hash="categories" className="w-full sm:w-auto">
                <motion.div
                  onPointerDown={nominateRipple.onPointerDown}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-elegant sm:w-auto"
                >
                  Nominate Now
                  {nominateRipple.rippleSpans}
                </motion.div>
              </Link>
              <Link to="/winners" className="w-full sm:w-auto">
                <motion.div
                  onPointerDown={winnersRipple.onPointerDown}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="glass-pill relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full px-8 font-semibold text-foreground sm:w-auto"
                >
                  View Winners
                  {winnersRipple.rippleSpans}
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Info chips — horizontal scroll on mobile, no scrollbar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="no-scrollbar -mx-6 mt-12 flex gap-3 overflow-x-auto px-6 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0"
          >
            <InfoChip
              icon={Calendar}
              title="Recognition Period"
              value={AWARD_THEME.recognitionPeriod}
            />
            <InfoChip
              icon={Sparkles}
              title="Nomination Window"
              value={AWARD_THEME.nominationWindow}
            />
            <InfoChip icon={MapPin} title="Venue" value={AWARD_THEME.venue} />
            <InfoChip
              icon={Users}
              title={AWARD_THEME.openingAddressTitle}
              value={AWARD_THEME.openingAddressRemarks}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-6">
        <div className="glass grid grid-cols-3 divide-x divide-white/40 overflow-hidden rounded-[28px]">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
              whileHover={{ backgroundColor: "oklch(1 0 0 / 0.25)" }}
              className="px-4 py-6 text-center"
            >
              <p className="text-3xl font-bold text-primary sm:text-4xl">{s.num}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Access portals */}
      <section id="access" className="relative z-10 mx-auto max-w-4xl px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="glass rounded-[28px] p-6 sm:p-8"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Secure Access</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Login Portals</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link to="/admin" className="glass-strong block rounded-[22px] p-5 text-left">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="font-semibold">Admin Login</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Approve nominations, manage categories, and supervise judge activity.
                </p>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: 0.12, ease: EASE }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link to="/judge" className="glass-strong block rounded-[22px] p-5 text-left">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <Star className="h-5 w-5" />
                  <p className="font-semibold">Judge Login</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Score shortlisted nominations and add judging comments.
                </p>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Nomination Period Closed Banner */}
      {!nominationsOpen && (
        <section className="relative z-10 mx-auto max-w-4xl px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[24px] border-red-200/60 px-6 py-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Nomination Period Has Closed</h3>
                <p className="mt-1 text-sm text-red-800/80">
                  Thank you for your interest! Nominations are currently closed — no new submissions
                  are being accepted.
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* About */}
      <section id="about" className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary">About</p>
          <h2 className="mx-auto mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
            Recognising <span className="text-primary">excellence and service</span> across our
            staff.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
            The Registrar's Ambit Staff Awards recognise the outstanding achievements of staff whose
            values, leadership and service demonstrate the highest standards of excellence and
            integrity — honouring those who embody:{" "}
            <span className="text-foreground">
              "{AWARD_THEME.title}: {AWARD_THEME.subtitle}"
            </span>
          </p>
        </motion.div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            { t: "Nominee", d: "Put forward in recognition of their contributions." },
            { t: "Nominator", d: "Colleague, manager or self who submits the nomination." },
            {
              t: "Self-nomination",
              d: "Encouraged when supported by a credible Portfolio of Evidence.",
            },
          ].map((d, i) => (
            <motion.div
              key={d.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: EASE }}
              whileHover={{ y: -3 }}
              className="glass rounded-2xl px-4 py-3 text-left"
              style={{ maxWidth: "15rem" }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {d.t}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/75">{d.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Six Categories</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Celebrating <span className="text-primary">staff excellence.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Tap a category to read the full criteria and nominate a colleague.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AWARD_CATEGORIES.map((c, i) => {
            const Icon = CATEGORY_ICONS[c.id] ?? Award;
            const isExpanded = expandedId === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`glass relative flex flex-col overflow-hidden rounded-[26px] cursor-pointer transition-shadow ${
                  isExpanded ? "shadow-elegant" : ""
                }`}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="relative flex flex-1 flex-col p-6">
                  <div className="mb-5 flex items-start justify-between">
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.08 }}
                      transition={{ duration: 0.2 }}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-elegant"
                    >
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-1"
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-bold leading-snug">{c.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.tagline}</p>

                  {!isExpanded && (
                    <div className="mt-4 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-widest text-primary/70">
                        Tap to nominate
                      </span>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="border-t border-white/40 bg-white/30 px-6 py-4">
                        <p className="mb-3 text-xs leading-relaxed text-foreground/80">
                          {c.description}
                        </p>
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                          Full Criteria
                        </p>
                        <ul className="space-y-2 text-xs text-foreground/80">
                          {c.recognises.map((r) => (
                            <li key={r} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {r}
                            </li>
                          ))}
                        </ul>
                        <NominateButton
                          isProcessing={nominatingId === c.id}
                          nominationsOpen={nominationsOpen}
                          onNominate={() => handleNominate(c.id)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Event details */}
      <section id="event" className="relative z-10 mx-auto max-w-4xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="glass rounded-[28px] p-8 text-center sm:p-12"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Trophy className="mx-auto h-9 w-9 text-primary" />
          </motion.div>
          <p className="mx-auto mt-5 max-w-lg text-xl font-bold leading-snug text-foreground sm:text-2xl">
            "Recognising Excellence. Celebrating Service. Honouring Our People."
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            — Registrar's Ambit Staff Awards Mission
          </p>
        </motion.div>
      </section>

      {/* Detailed Programme & Venue */}
      <EventProgram />

      <footer className="relative z-10 px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="glass mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 rounded-[24px] px-6 py-6 text-sm text-muted-foreground sm:flex-row"
        >
          <p>© 2026 Registrar's Ambit Staff Awards</p>
          <p>Recognising Excellence · Celebrating Service · Honouring Our People</p>
        </motion.div>
      </footer>
    </div>
  );
}

/** The per-category CTA — its own component so each gets an independent ripple state. */
function NominateButton({
  isProcessing,
  nominationsOpen,
  onNominate,
}: {
  isProcessing: boolean;
  nominationsOpen: boolean;
  onNominate: () => void;
}) {
  const ripple = useRipple("light");

  return (
    <motion.button
      onPointerDown={(e) => {
        e.stopPropagation();
        if (nominationsOpen && !isProcessing) ripple.onPointerDown(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (nominationsOpen) onNominate();
      }}
      disabled={isProcessing || !nominationsOpen}
      whileTap={!isProcessing && nominationsOpen ? { scale: 0.95 } : {}}
      className="relative mt-4 w-full overflow-hidden rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-90 disabled:opacity-60"
      title={!nominationsOpen ? "Nomination period has closed" : ""}
    >
      <div className="flex items-center justify-center gap-2">
        {isProcessing ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader className="h-4 w-4" />
            </motion.div>
            <span>Processing...</span>
          </>
        ) : !nominationsOpen ? (
          <span>Nominations Closed</span>
        ) : (
          <span>Nominate for this Award</span>
        )}
      </div>
      {ripple.rippleSpans}
    </motion.button>
  );
}

function InfoChip({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Award;
  title: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="glass flex min-w-[15rem] shrink-0 items-center gap-3 rounded-2xl p-4 sm:min-w-0"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-elegant">
        <Icon className="h-4.5 w-4.5 text-primary-foreground" />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}
