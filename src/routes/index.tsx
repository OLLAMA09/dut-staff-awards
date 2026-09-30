import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  useVelocity,
} from "framer-motion";
import { gsap } from "gsap";
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
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import ShatterText from "@/components/ShatterText";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import EventProgram from "@/components/EventProgram";
import { TriangleBackground } from "@/components/TriangleBackground";
import { useJudgingActive, useNominationsOpen } from "@/lib/nomination-settings";
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

const CAMPUS_PHOTOS = [
  { src: "/images.jpg", alt: "DUT Steve Biko campus" },
  { src: "/Khanyisile-Afrisolar-Project-DUT11.jpg", alt: "DUT campus building" },
  { src: "/images (1).jpg", alt: "DUT S Block campus buildings" },
  { src: "/images (2).jpg", alt: "DUT Innovation Campus entrance" },
];

const stats = [
  { num: "1", label: "Premier Event" },
  { num: "6", label: "Categories" },
  { num: "2026", label: "Year" },
];

/** Premium, expo-style ease used across reveal animations for a consistent, deliberate feel. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

function StickerPhoto({ photo, className = "" }: { photo: (typeof CAMPUS_PHOTOS)[number]; className?: string }) {
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.4, rotate: -10 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 260, damping: 14, mass: 0.9 }}
      whileHover={{ scale: 1.06, rotate: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`sticker-photo relative p-2 ${className}`}
    >
      <img src={photo.src} alt={photo.alt} loading="lazy" className="h-full w-full object-cover" />
    </motion.figure>
  );
}

type HeadingSegment = { text: string; highlight?: boolean };

/** Heading that slides in from the right and types itself out, once, on first scroll into view. */
function TypewriterHeading({
  segments,
  className,
  as: Tag = "h2",
  speedMs = 28,
}: {
  segments: HeadingSegment[];
  className?: string;
  as?: "h1" | "h2" | "h3";
  speedMs?: number;
}) {
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const fullText = segments.map((s) => s.text).join("");

  useEffect(() => {
    if (!started || revealed >= fullText.length) return;
    const id = window.setTimeout(() => setRevealed((r) => r + 1), speedMs);
    return () => window.clearTimeout(id);
  }, [started, revealed, fullText.length, speedMs]);

  let remaining = revealed;
  const rendered = segments.map((seg, i) => {
    const take = Math.max(0, Math.min(seg.text.length, remaining));
    remaining -= take;
    return (
      <span key={i} className={seg.highlight ? "gold-underline" : undefined}>
        {seg.text.slice(0, take)}
      </span>
    );
  });

  const MotionTag = motion[Tag];

  return (
    <MotionTag
      initial={{ opacity: 0, x: 72 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE }}
      onViewportEnter={() => setStarted(true)}
      className={className}
      aria-label={fullText}
    >
      <span aria-hidden="true">
        {rendered}
        {started && revealed < fullText.length && <span className="typewriter-cursor" />}
      </span>
    </MotionTag>
  );
}

/** Thin fading rule used to visually separate major page sections. */
function SectionDivider() {
  return (
    <div className="relative z-10 mx-auto h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
  );
}

/** Element's position in the document from layout alone — ignores transforms and scroll. */
function pageOffset(el: HTMLElement) {
  let left = 0;
  let top = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) {
    left += node.offsetLeft;
    top += node.offsetTop;
  }
  return { left, top };
}

function HeroStory({
  nominationsOpen,
  landingRef,
}: {
  nominationsOpen: boolean;
  /** Where the DUT mark lands and bursts apart once it has flown down the hero. */
  landingRef: RefObject<HTMLElement | null>;
}) {
  const storyRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ["start start", "end end"] });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.82], [1, 0.72]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const photoY = useTransform(scrollYProgress, [0, 1], [0, -44]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const nominateRipple = useRipple("light");
  const winnersRipple = useRipple("dark");

  // DUT mark: takes off from its slot above the eyebrow and glides down to land on the
  // event-info cards, touching down about halfway down the screen, then bursts apart as
  // you keep scrolling (scroll back up and it reassembles and flies home). The route is
  // measured from the real layout, so it lands on the cards at any screen size.
  const dutHomeRef = useRef<HTMLDivElement>(null);
  const [dutHome, setDutHome] = useState<{ left: number; top: number } | null>(null);
  type Flight = { dx: number; dy: number; landAt: number; burstSpan: number };
  const flightRef = useRef<Flight | null>(null);
  const { scrollY } = useScroll();
  const dutX = useMotionValue(0);
  const dutY = useMotionValue(0);
  const dutBurst = useMotionValue(0);
  const dutOpacity = useTransform(scrollYProgress, [0, 0.4], [0.92, 0.78]);

  const placeDut = () => {
    const flight = flightRef.current;
    if (!flight) return;
    const y = window.scrollY;
    const travelled = Math.min(1, Math.max(0, y / flight.landAt));
    dutX.set(flight.dx * travelled);
    dutY.set(flight.dy * travelled);
    dutBurst.set(Math.min(1, Math.max(0, (y - flight.landAt) / flight.burstSpan)));
  };
  useMotionValueEvent(scrollY, "change", placeDut);

  // A passive effect, not a layout one: the landing section renders after this component,
  // so its ref isn't attached yet when this component's layout effects run.
  useEffect(() => {
    const story = storyRef.current;
    const home = dutHomeRef.current;
    const landing = landingRef.current;
    if (!story || !home || !landing) return;

    const measure = () => {
      const storyAt = pageOffset(story);
      const homeAt = pageOffset(home);
      const landingAt = pageOffset(landing);
      const viewportHeight = window.innerHeight;
      // Centred on the card row, with the mark's lower quarter over the cards' top edge.
      const landLeft = landingAt.left + landing.offsetWidth / 2 - home.offsetWidth / 2;
      const landTop = landingAt.top - home.offsetHeight * 0.75;
      flightRef.current = {
        dx: landLeft - homeAt.left,
        dy: landTop - homeAt.top,
        landAt: Math.max(1, landTop - viewportHeight * 0.45),
        burstSpan: Math.max(160, viewportHeight * 0.25),
      };
      setDutHome({ left: homeAt.left - storyAt.left, top: homeAt.top - storyAt.top });
      placeDut();
    };

    measure();
    // The slot moves when the hero copy re-wraps (fonts, resizes) even if the section
    // keeps its size, so watch the column it sits in as well as both sections.
    const observer = new ResizeObserver(measure);
    observer.observe(story);
    observer.observe(landing);
    if (home.parentElement) observer.observe(home.parentElement);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs and motion values are stable
  }, []);
  // Scrolling down blasts it apart (destroy); scrolling up (or settling) just lets it
  // spring back home (reform) — on top of the existing pointer-hover shatter.
  const dutScrollVelocity = useVelocity(scrollYProgress);
  const dutShatterForce = useTransform(dutScrollVelocity, (v) => Math.min(16, Math.max(0, v) * 5));

  return (
    <section ref={storyRef} className="relative min-h-[122svh]">
      {/* The flying DUT lives out here rather than in its slot below: the panel it starts
          in clips its overflow, which used to cut the mark off partway down its flight.
          Placed before the panel so the hero copy still reads on top of it. */}
      <motion.div
        aria-label="Durban University of Technology"
        style={{
          x: dutX,
          y: dutY,
          opacity: dutOpacity,
          left: dutHome?.left ?? 0,
          top: dutHome?.top ?? 0,
          visibility: dutHome ? "visible" : "hidden",
        }}
        className="dut-mark pointer-events-none absolute z-0 h-14 w-36 sm:h-16 sm:w-40"
      >
        <ShatterText
          text="DUT"
          className="h-full w-full"
          repelRadius={90}
          scrollDisturbance={dutShatterForce}
          explodeProgress={dutBurst}
          bleed={120}
        />
      </motion.div>

      <div className="sticky top-0 flex min-h-[92svh] items-center overflow-hidden py-24 sm:py-28">
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <motion.div
            style={{ opacity: contentOpacity, scale: contentScale, y: contentY }}
            className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left"
          >
            {/* The DUT mark's home slot: reserves its space and the gap before the eyebrow.
                The mark itself is drawn (and flies) from outside this panel — see above. */}
            <div
              ref={dutHomeRef}
              aria-hidden="true"
              className="mx-auto mb-6 h-14 w-36 lg:mx-0 sm:h-16 sm:w-40"
            />

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white">Registrar's Ambit Staff Awards</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] text-white sm:text-6xl">Recognition starts with a story worth telling.</h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white sm:text-lg lg:mx-0">Celebrate colleagues and units whose work gives excellence a daily shape.</p>
            {!nominationsOpen && (
              <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md lg:mx-0">
                <AlertCircle className="h-3.5 w-3.5" /> Nominations are now closed
              </p>
            )}
            {/* When nominations close, winners become the primary action */}
            <div className={`${nominationsOpen ? "mt-8" : "mt-4"} flex flex-col items-center gap-3 sm:flex-row lg:justify-start`}>
              <Link to={nominationsOpen ? "/" : "/winners"} hash={nominationsOpen ? "categories" : undefined} className="w-full sm:w-auto">
                <motion.div initial={{ opacity: 0, x: -22 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: EASE }} onPointerDown={nominateRipple.onPointerDown} whileHover={{ scale: 1.04, y: -2, rotate: -1 }} whileTap={{ scale: 0.95 }} className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-gold px-8 font-semibold text-primary shadow-elegant transition-[filter] hover:brightness-95 sm:w-auto">
                  {nominationsOpen ? "Nominate Now" : "View Winners"}
                  {nominateRipple.rippleSpans}
                </motion.div>
              </Link>
              <Link to={nominationsOpen ? "/winners" : "/"} hash={nominationsOpen ? undefined : "categories"} className="w-full sm:w-auto">
                <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5, ease: EASE }} onPointerDown={winnersRipple.onPointerDown} whileHover={{ scale: 1.04, y: -2, rotate: 1 }} whileTap={{ scale: 0.95 }} className="glass-pill relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full px-8 font-semibold text-foreground sm:w-auto">
                  {nominationsOpen ? "View Winners" : "Award Categories"}
                  {winnersRipple.rippleSpans}
                </motion.div>
              </Link>
            </div>
            {nominationsOpen && AWARD_THEME.closingDate !== "TBC" && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white lg:justify-start">
                <Calendar className="h-4 w-4" /> Nominations close {AWARD_THEME.closingDate}
              </p>
            )}
          </motion.div>

          <div className="relative mx-auto h-72 w-full max-w-2xl sm:h-[28rem]">
            <motion.div initial={{ opacity: 0, scale: 1.08, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: -2 }} transition={{ duration: 0.8, ease: EASE }} style={{ y: photoY, scale: photoScale }} className="absolute inset-2">
              <StickerPhoto photo={CAMPUS_PHOTOS[0]} className="h-full w-full" />
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.55, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} whileHover={{ scale: 1.06, rotate: -2 }} transition={{ delay: 0.65, type: "spring", stiffness: 260, damping: 16 }} className="absolute -bottom-3 -left-1 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-semibold text-primary shadow-elegant backdrop-blur-xl sm:left-4">
              Nomination journey
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 18, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              whileHover={{ y: -6, rotate: -1, scale: 1.03 }}
              transition={{ delay: 0.8, duration: 0.55, ease: EASE }}
              className="absolute -right-2 top-8 w-44 rounded-2xl border border-white/80 bg-white/90 p-3 text-left shadow-elegant backdrop-blur-xl sm:right-3"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-copper text-[10px] text-white">3</span>
                Nomination ready
              </div>
              <div className="mt-3 space-y-2 border-t border-primary/10 pt-2 text-[10px] text-muted-foreground">
                <p className="flex items-center justify-between"><span>Category selected</span><span className="font-bold text-copper">Done</span></p>
                <p className="flex items-center justify-between"><span>Evidence prepared</span><span className="font-bold text-copper">Ready</span></p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Sections tracked by the side scroll-spy navigator, in page order. */
const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "categories", label: "Categories" },
  { id: "event", label: "Event" },
  { id: "access", label: "Access" },
  { id: "program", label: "Programme" },
] as const;

function Index() {
  const { open: nominationsOpen } = useNominationsOpen();
  const { active: judgingActive } = useJudgingActive();
  // The event stamp follows the live award stage rather than a fixed label
  const stage = nominationsOpen
    ? { label: ["Nominations", "Open"], Icon: Sparkles }
    : judgingActive
      ? { label: ["Judging", "Underway"], Icon: Star }
      : { label: ["Judging", "Complete"], Icon: CheckCircle2 };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nominatingId, setNominatingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const aboutRef = useRef<HTMLElement>(null);
  // Types the About DUT mark in left-to-right as the section scrolls into view, and
  // un-types it the same way if you scroll back up before it finishes.
  const { scrollYProgress: aboutScrollProgress } = useScroll({
    target: aboutRef,
    offset: ["start end", "end start"],
  });
  const aboutDutType = useTransform(aboutScrollProgress, [0.15, 0.45], [0, 1]);

  const heroRef = useRef<HTMLDivElement>(null);
  const eventInfoRef = useRef<HTMLElement>(null);
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

  useLayoutEffect(() => {
    const section = aboutRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      const targets = [".about-photo", ".about-eyebrow", ".about-title", ".about-copy", ".about-role"];
      gsap.set(targets, { willChange: "transform, opacity" });
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          gsap.timeline()
            .fromTo(".about-photo", { opacity: 0, scale: 0.88, rotate: -8, x: 52 }, { opacity: 1, scale: 1, rotate: -2, x: 0, duration: 0.9, ease: "power3.out" })
            .fromTo(".about-eyebrow", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, "-=0.65")
            .fromTo(".about-title", { opacity: 0, y: 34, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.68, ease: "power4.out" }, "-=0.2")
            .fromTo(".about-copy", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.52, ease: "power3.out" }, "-=0.35")
            .fromTo(".about-role", { opacity: 0, y: 28, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.48, stagger: 0.1, ease: "back.out(1.4)" }, "-=0.2");
          observer.disconnect();
        },
        { threshold: 0.24 },
      );
      observer.observe(section);
      return () => observer.disconnect();
    }, section);
    return () => context.revert();
  }, []);

  const handleNominate = async (categoryId: string) => {
    setNominatingId(categoryId);
    await new Promise((resolve) => setTimeout(resolve, 300));
    navigate({ to: "/nominate/$categoryId", params: { categoryId } });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hero text-foreground">

      {/* Left & right triangle banners in the gutters beside the content column */}
      {(["left", "right"] as const).map((side) => (
        <TriangleBackground
          key={side}
          tone="vivid"
          pattern="cascade"
          cellSize={40}
          gap={4}
          rippleRadius={2}
          autoplay={320}
          className={`pointer-events-none !fixed top-0 bottom-0 z-0 hidden !h-auto xl:block ${
            side === "left" ? "left-0" : "right-0"
          }`}
          style={{
            width: "min(260px, max(0px, calc((100vw - 72rem) / 2 - 8px)))",
            maskImage: `linear-gradient(to ${side === "left" ? "right" : "left"}, black 55%, transparent)`,
            WebkitMaskImage: `linear-gradient(to ${side === "left" ? "right" : "left"}, black 55%, transparent)`,
          }}
        />
      ))}

      {/* Custom gold scroll-progress indicator — the native scrollbar stays hidden */}
      <div className="pointer-events-none fixed right-1 top-24 bottom-6 z-[60] w-1 rounded-full bg-gold/20">
        <motion.div
          style={{ scaleY: pageProgress }}
          className="h-full w-full origin-top rounded-full bg-gold"
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
                className={`text-[10px] font-semibold uppercase tracking-[0.15em] text-white [text-shadow:0_1px_6px_oklch(0.34_0.07_250/0.9)] transition-all duration-200 ${
                  isActive
                    ? "translate-x-0 opacity-100"
                    : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {s.label}
              </span>
              <span
                className={`shrink-0 rounded-full shadow-[0_0_6px_oklch(0.34_0.07_250/0.8)] transition-all duration-200 ${
                  isActive
                    ? "h-2.5 w-2.5 bg-white"
                    : "h-1.5 w-1.5 bg-white/50 group-hover:bg-white/80"
                }`}
              />
            </a>
          );
        })}
      </nav>

      <SiteNav />

      {/* Hero */}
      {/* overflow-x-clip, not overflow-hidden: the DUT mark flies out of the bottom of
          this section to land on the event-info cards and must not be cut off there. */}
      <section
        ref={heroRef}
        id="hero"
        className="relative overflow-x-clip"
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

        <HeroStory nominationsOpen={nominationsOpen} landingRef={eventInfoRef} />

      </section>

      {/* Event information */}
      <section ref={eventInfoRef} className="relative z-10 mx-auto max-w-6xl px-6 pb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoChip index={0} icon={Calendar} title="Recognition Period" value={AWARD_THEME.recognitionPeriod} />
          <InfoChip index={1} icon={Sparkles} title="Nomination Window" value={AWARD_THEME.nominationWindow} />
          <InfoChip index={2} icon={MapPin} title="Venue" value={AWARD_THEME.venue} />
          <InfoChip index={3} icon={Users} title={AWARD_THEME.openingAddressTitle} value={AWARD_THEME.openingAddressRemarks} />
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-6">
        <div className="glass grid grid-cols-3 divide-x divide-white/40 overflow-hidden rounded-[28px]">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.04 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 220, damping: 17 }}
              className="px-4 py-6 text-center"
            >
              <p className="text-3xl font-bold text-primary sm:text-4xl">{s.num}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* About */}
      <section ref={aboutRef} id="about" className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 text-center lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:text-left">
        <div className="lg:order-1">
          <p className="about-eyebrow text-xs uppercase tracking-[0.3em] text-white">About</p>
          <TypewriterHeading
            className="about-title mx-auto mt-4 max-w-xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:mx-0"
            segments={[
              { text: "Recognising " },
              { text: "excellence and service", highlight: true },
              { text: " across our staff." },
            ]}
          />
          <p className="about-copy mx-auto mt-5 max-w-xl leading-relaxed text-white lg:mx-0">
            The Registrar's Ambit Staff Awards recognise the outstanding achievements of staff whose
            values, leadership and service demonstrate the highest standards of excellence and
            integrity — honouring those who embody:{" "}
            <span className="font-semibold text-white">
              "{AWARD_THEME.title}: {AWARD_THEME.subtitle}"
            </span>
          </p>

          {/* Reverse-triangle layout: two cards up top, the third centred below them. */}
          <div className="mx-auto mt-8 grid max-w-md grid-cols-2 justify-items-center gap-3 lg:mx-0 lg:justify-items-start">
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
                whileHover={{ y: -3 }}
                className={`about-role glass w-full max-w-[15rem] rounded-2xl px-4 py-3 text-left ${
                  i === 2 ? "col-span-2 justify-self-center lg:justify-self-start" : ""
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {d.t}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/75">{d.d}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="about-photo relative mx-auto flex h-80 w-full max-w-xl items-center justify-center sm:h-[26rem] lg:order-2 lg:h-[32rem] lg:max-w-none">
          {/* Idle float + sway so the mark reads as alive before anyone touches it —
              a separate element from this container, which GSAP already animates on entry. */}
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="h-2/3 w-2/3"
          >
            <ShatterText text="DUT" className="h-full w-full" repelRadius={90} typeProgress={aboutDutType} />
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Nomination Period Closed Banner — brings its own divider so none doubles up when hidden */}
      {!nominationsOpen && (
        <>
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
        <SectionDivider />
        </>
      )}

      {/* Categories */}
      <section id="categories" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white">Six Categories</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Celebrating <span className="gold-underline">staff excellence.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white">
            Tap a category to read the full criteria and nominate a colleague.
          </p>
        </div>

        <div className="grid gap-5">
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
                className={`relative flex flex-col overflow-hidden rounded-[26px] border border-primary/30 bg-gradient-to-br from-card to-secondary/40 transition-[box-shadow,border-color] hover:border-gold hover:shadow-[0_0_20px_color-mix(in_oklab,var(--gold)_40%,transparent)] ${
                  isExpanded ? "shadow-elegant" : ""
                }`}
              >
                {/* Only the header toggles — keeps the Nominate button from being nested inside another button */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`category-${c.id}-details`}
                  aria-label={`${isExpanded ? "Hide" : "Show"} criteria for ${c.name}`}
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpandedId(isExpanded ? null : c.id);
                    }
                  }}
                  className={`relative grid flex-1 cursor-pointer gap-4 rounded-[26px] px-6 pt-6 ${isExpanded ? "pb-6" : "pb-3"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-6`}
                >
                  <div className="flex items-start justify-between sm:contents">
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.08 }}
                      transition={{ duration: 0.2 }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-elegant"
                    >
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-1 sm:order-3"
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                  <div className="sm:col-start-2 sm:row-start-1">
                    <h3 className="text-lg font-bold leading-snug">{c.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.tagline}</p>
                  </div>
                </div>

                {/* Card actions sit outside the toggle so neither button is nested inside another */}
                {!isExpanded && (
                  <div className="flex items-center justify-between gap-4 px-6 pb-6 sm:pl-[5.75rem]">
                    <button
                      type="button"
                      onClick={() => setExpandedId(c.id)}
                      aria-expanded={false}
                      aria-controls={`category-${c.id}-details`}
                      className="flex items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-widest text-primary/70">
                        View criteria
                      </span>
                    </button>
                    {nominationsOpen && (
                      <button
                        type="button"
                        onClick={() => handleNominate(c.id)}
                        disabled={nominatingId === c.id}
                        aria-label={`Nominate for the ${c.name}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold px-3.5 py-1.5 text-xs font-semibold text-primary shadow-elegant transition-[filter] hover:brightness-95 disabled:opacity-60"
                      >
                        {nominatingId === c.id ? (
                          "Opening…"
                        ) : (
                          <>
                            Nominate <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      id={`category-${c.id}-details`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-5 border-t border-white/40 bg-white/30 px-6 py-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-8">
                        <div>
                          <p className="text-xs leading-relaxed text-foreground/80">
                          {c.description}
                          </p>
                          <NominateButton
                            isProcessing={nominatingId === c.id}
                            nominationsOpen={nominationsOpen}
                            onNominate={() => handleNominate(c.id)}
                          />
                        </div>
                        <div>
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                            Full Criteria
                          </p>
                          <ul className="grid gap-x-6 gap-y-2 text-xs text-foreground/80 sm:grid-cols-2">
                            {c.recognises.map((r) => (
                              <li key={r} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      <SectionDivider />

      {/* Event details */}
      <section id="event" className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)]">
        <div className="relative mx-auto h-64 w-full max-w-sm sm:h-80 lg:mx-0">
          <StickerPhoto photo={CAMPUS_PHOTOS[3]} className="h-full w-full rotate-2" />
          <motion.div
            initial={{ opacity: 0, scale: 0.4, rotate: 12 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 8 }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ scale: 1.08, rotate: 4 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 14 }}
            className="absolute -right-4 -top-4 flex h-20 w-20 rotate-[8deg] items-center justify-center rounded-full border-2 border-dashed border-primary/70 bg-white/95 text-center shadow-elegant sm:-right-5 sm:-top-5 sm:h-24 sm:w-24"
          >
            <span className="flex flex-col items-center gap-0.5 px-1 text-[9px] font-bold uppercase leading-tight tracking-wide text-primary sm:text-[10px]">
              <stage.Icon className="mb-0.5 h-4 w-4" />
              <span>{stage.label[0]}</span>
              <span>{stage.label[1]}</span>
            </span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 240, damping: 15, mass: 0.9, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-[28px] border border-primary/30 bg-card p-8 text-center shadow-elegant sm:p-12"
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

      <SectionDivider />

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
              initial={{ opacity: 0, x: -28, rotate: -2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
              whileHover={{ y: -5, scale: 1.015 }}
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
              initial={{ opacity: 0, x: 28, rotate: 2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: 0.12, ease: EASE }}
              whileHover={{ y: -5, scale: 1.015 }}
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

      <SectionDivider />

      {/* Detailed Programme & Venue */}
      <EventProgram />

      <SiteFooter />
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
      className="relative mt-4 w-full overflow-hidden rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-primary shadow-elegant transition hover:brightness-95 disabled:opacity-60"
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
  index,
  icon: Icon,
  title,
  value,
}: {
  index: number;
  icon: typeof Award;
  title: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: index % 2 === 0 ? 22 : -22, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -5, scale: 1.02, rotate: index % 2 === 0 ? -0.5 : 0.5 }}
      transition={{ delay: index * 0.09, type: "spring", stiffness: 230, damping: 18 }}
      className="glass flex min-w-[15rem] shrink-0 items-center gap-3 rounded-2xl p-4 sm:min-w-0"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-elegant">
        <Icon className="h-4.5 w-4.5 text-primary-foreground" />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-primary">{value}</p>
      </div>
    </motion.div>
  );
}
