import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Sparkles, Calendar, MapPin, Users, Trophy, Heart, ChevronDown, ShieldCheck, Star, Loader, AlertCircle } from "lucide-react";
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
  { num: "1", label: "Premier Awards Event" },
  { num: "6", label: "Award Categories" },
  { num: "2026", label: "Year of Excellence" },
];

function Index() {
  const { open: nominationsOpen } = useNominationsOpen();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nominatingId, setNominatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNominate = async (categoryId: string) => {
    setNominatingId(categoryId);
    // Brief delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    navigate({ to: "/nominate/$categoryId", params: { categoryId } });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hero text-foreground">
      <RouteTransitionLoader />

      <SiteNav />

      {/* Hero */}
      <section className="relative z-10 pt-20">
          <div className="mx-auto max-w-3xl px-6 pt-12 pb-24 lg:pt-20 lg:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative"
          >
            
            <h1 className="text-4xl font-bold leading-[1.1] sm:text-6xl lg:text-7xl text-foreground">
              {AWARD_THEME.yearsBadge}
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              Recognising Excellence. Celebrating Service. Honouring Our People.
              Nominate outstanding DUT staff who exemplify our values, leadership, and exceptional service.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 lg:hidden">
               <Link to="/winners" className="w-full sm:w-auto">
                <div className="h-12 border border-primary/20 rounded-md flex items-center justify-center bg-background hover:bg-accent transition-colors text-foreground font-medium">View Winners</div>
               </Link>
               <Link to="/" hash="categories" className="w-full sm:w-auto">
                <div className="h-12 bg-primary text-primary-foreground rounded-md flex items-center justify-center gap-2 transition-all font-medium">
                  Nominate Now
                </div>
               </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <InfoChip icon={Calendar} title="Recognition Period" value={AWARD_THEME.recognitionPeriod} />
              <InfoChip icon={Sparkles} title="Nomination Window" value={AWARD_THEME.nominationWindow} />
              <InfoChip icon={MapPin} title="Venue" value={AWARD_THEME.venue} />
              <InfoChip icon={Users} title={AWARD_THEME.openingAddressTitle} value={AWARD_THEME.openingAddressRemarks} />
            </div>
          </motion.div>

          {/* Image/3D section hidden */}
        </div>

        {/* Marquee */}
        <div className="relative overflow-hidden border-y border-primary/20 bg-primary/5 py-6">
          <div className="flex gap-16 whitespace-nowrap text-3xl text-foreground" style={{animation:'marquee 24s linear infinite'}}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>EXCELLENCE · LEADERSHIP · SERVICE · COURAGE · LEGACY · DUT 2026 · </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-px sm:overflow-hidden sm:rounded-2xl sm:border sm:border-primary/20 sm:bg-primary/10">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-white px-6 py-5 sm:block sm:rounded-none sm:border-0 sm:p-8 sm:text-center"
            >
              <p className="text-primary text-4xl font-bold sm:text-5xl">{s.num}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground sm:mt-2">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Access portals */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-6">
        <div className="rounded-3xl border border-primary/20 bg-white/70 p-6 backdrop-blur sm:p-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Secure Access</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Login Portals</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Administrators manage nominations and oversight. Judges review shortlisted nominations and submit ratings.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <p className="font-semibold">Admin Login</p>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Sign in to approve nominations, manage categories, and supervise judge activity.
              </p>
              <Link to="/admin" className="w-full">
                <div className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 font-medium flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer">Go to Admin Panel</div>
              </Link>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <Star className="h-5 w-5" />
                <p className="font-semibold">Judge Login</p>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Sign in to score shortlisted nominations and add judging comments.
              </p>
              <Link to="/judge" className="w-full">
                <div className="w-full border border-primary/30 bg-background text-foreground rounded-md px-4 py-2 font-medium flex items-center justify-center hover:bg-accent transition-colors cursor-pointer">Go to Judge Panel</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">About the Registrar's Ambit Staff Awards</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Recognising <span className="text-primary">excellence and service</span> across our staff.
            </h2>
          </div>
          <div className="space-y-6 text-muted-foreground lg:col-span-7">
            <p className="text-lg leading-relaxed">
              The Registrar's Ambit Staff Awards recognise the outstanding achievements of staff whose
              values, leadership and service demonstrate the highest standards of excellence and integrity.
              The Registrar's Ambit Staff Awards celebrate staff who embody our mission:
              <span className="text-foreground"> Recognising Excellence. Celebrating Service. Honouring Our People.</span>
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { t: "Nominee", d: "A staff member or unit put forward in recognition of their contributions." },
                { t: "Nominator", d: "The person — colleague, manager or self — who submits the nomination." },
                { t: "Self-nomination", d: "Permitted and encouraged when supported by a credible Portfolio of Evidence." },
              ].map((d) => (
                <div key={d.t} className="rounded-xl border border-primary/20 bg-white p-4">
                  <p className="text-xs uppercase tracking-wider text-primary">{d.t}</p>
                  <p className="mt-1 text-sm text-foreground/80">{d.d}</p>
                </div>
              ))}
            </div>
            <p className="leading-relaxed">
              <span className="text-foreground">"{AWARD_THEME.title}: {AWARD_THEME.subtitle}"</span> —
              honours staff who exemplify excellence and inspiring service across the Durban University of Technology.
            </p>
          </div>
        </div>
      </section>

      {/* Nomination Period Closed Banner */}
      {!nominationsOpen && (
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-red-300 bg-red-50 px-6 py-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900">Nomination Period Has Closed</h3>
                <p className="text-sm text-red-800 mt-1">
                  Thank you for your interest in the Registrar's Ambit Staff Awards! Nominations are currently closed.
                  No new nominations are being accepted. Thank you to everyone who participated!
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Categories */}
      <section id="categories" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="mb-14 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground">Six Categories</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl text-foreground">
            Celebrating <span className="text-primary">staff excellence.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Each category recognises outstanding achievement in a distinct area of staff service.
            Read the criteria and nominate an exceptional colleague today.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AWARD_CATEGORIES.map((c, i) => {
            const Icon = CATEGORY_ICONS[c.id] ?? Award;
            const isExpanded = expandedId === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition cursor-pointer ${
                  isExpanded
                    ? "border-primary/60 shadow-elegant"
                    : "border-primary/20 hover:border-primary/50 hover:shadow-elegant"
                }`}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/30" />

                {/* Card header */}
                <div className="relative flex flex-1 flex-col p-6">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-elegant transition group-hover:scale-110">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-1"
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold leading-snug">{c.name}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{c.tagline}</p>

                  {/* Tap-to-expand hint — only visible when card is collapsed */}
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

                {/* Expanded content */}
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
                      <div className="border-t border-primary/20 bg-gray-50 px-6 py-4">
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
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (nominationsOpen) {
                              handleNominate(c.id);
                            }
                          }}
                          disabled={nominatingId === c.id || !nominationsOpen}
                          whileHover={nominatingId !== c.id && nominationsOpen ? { scale: 1.05 } : {}}
                          whileTap={nominatingId !== c.id && nominationsOpen ? { scale: 0.95 } : {}}
                          className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-90 disabled:opacity-70"
                          title={!nominationsOpen ? "Nomination period has closed" : ""}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {nominatingId === c.id ? (
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
                        </motion.button>
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
      <section id="event" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-white p-10 sm:p-16">

          <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">The Awards Ceremony</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl text-foreground">
                Celebrating <span className="text-primary">excellence</span> and service.
              </h2>
              <p className="mt-6 leading-relaxed text-gray-600">
                Join us for an evening honouring outstanding DUT staff. Ceremony date, time and schedule
                details will be announced closer to the event.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                {[
                  ["TBC", "Reception"],
                  ["TBC", "Ceremony Begins"],
                  ["TBC", "Awards & Recognition"],
                  ["TBC", "Closing"],
                ].map(([t, l]) => (
                  <div key={t} className="rounded-xl border border-primary/20 bg-gray-50 p-4">
                    <p className="text-primary text-2xl font-bold">{t}</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl border border-primary/30 bg-gray-50 p-8">
                <Trophy className="mb-4 h-10 w-10 text-primary" />
                <p className="text-3xl font-bold leading-tight text-foreground">
                  "Recognising Excellence. Celebrating Service. Honouring Our People."
                </p>
                <p className="mt-6 text-sm uppercase tracking-[0.2em] text-gray-500">
                  — Registrar's Ambit Staff Awards Mission
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Programme & Venue */}
      <EventProgram />

      <footer className="relative z-10 border-t border-primary/10 bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row border-t border-primary/10 pt-8">
            <p>© 2026 Registrar's Ambit Staff Awards</p>
            <p>Recognising Excellence · Celebrating Service · Honouring Our People</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InfoChip({ icon: Icon, title, value }: { icon: typeof Award; title: string; value: string }) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition hover:border-primary/40 hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-elegant transition group-hover:scale-110">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">{title}</p>
        <p className="mt-0.5 font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
