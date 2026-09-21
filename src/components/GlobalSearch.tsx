import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Home,
  Trophy,
  Calendar,
  Info,
  Sparkles,
  BookOpen,
  Play,
  Users,
  Gavel,
  Medal,
  Search,
  Award,
  Lock,
  ArrowRight,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { AWARD_CATEGORIES } from "@/data/awards";
import { subscribePastWinners, type PastWinner } from "@/lib/firestore";

type NavTarget =
  | { to: "/"; hash?: string }
  | { to: "/winners"; search?: { winner: string } }
  | { to: "/admin" | "/judge" | "/leaderboard" | "/guide" | "/demo" }
  | { to: "/nominate/$categoryId"; params: { categoryId: string } };

type StaticEntry = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  target: NavTarget;
  locked?: boolean;
  keywords?: string[];
};

function buildStaticEntries(isPrivileged: boolean): StaticEntry[] {
  const entries: StaticEntry[] = [
    {
      id: "home",
      title: "Home",
      subtitle: "Registrar's Ambit Staff Awards",
      icon: <Home />,
      target: { to: "/" },
      keywords: ["landing", "start"],
    },
    {
      id: "categories",
      title: "Award Categories",
      subtitle: "Browse all award categories",
      icon: <Trophy />,
      target: { to: "/", hash: "categories" },
      keywords: ["nominate", "awards", "browse"],
    },
    {
      id: "event",
      title: "Event Program",
      subtitle: "Ceremony schedule & details",
      icon: <Calendar />,
      target: { to: "/", hash: "event" },
      keywords: ["schedule", "ceremony", "programme", "date", "venue"],
    },
    {
      id: "about",
      title: "About the Awards",
      subtitle: "What the Registrar's Ambit Awards recognise",
      icon: <Info />,
      target: { to: "/", hash: "about" },
    },
    {
      id: "winners",
      title: "Past Winners",
      subtitle: "Hall of fame — celebrating past recipients",
      icon: <Sparkles />,
      target: { to: "/winners" },
      keywords: ["hall of fame", "recipients", "history"],
    },
  ];

  if (isPrivileged) {
    entries.push(
      {
        id: "guide",
        title: "Nomination Guide",
        subtitle: "Step-by-step guidance for admins & judges",
        icon: <BookOpen />,
        target: { to: "/guide" },
      },
      {
        id: "demo",
        title: "Demo Walkthrough",
        subtitle: "See the platform in action",
        icon: <Play />,
        target: { to: "/demo" },
      },
    );
  }

  entries.push(
    {
      id: "admin",
      title: "Admin Portal",
      subtitle: "Manage nominations, categories & accounts",
      icon: <Users />,
      target: { to: "/admin" },
      locked: !isPrivileged,
      keywords: ["dashboard", "manage", "sign in"],
    },
    {
      id: "judge",
      title: "Judge Portal",
      subtitle: "Score shortlisted nominations",
      icon: <Gavel />,
      target: { to: "/judge" },
      locked: !isPrivileged,
      keywords: ["scoring", "evaluate", "sign in"],
    },
    {
      id: "leaderboard",
      title: "Leaderboard",
      subtitle: "Live scoring standings",
      icon: <Medal />,
      target: { to: "/leaderboard" },
      locked: !isPrivileged,
      keywords: ["scores", "ranking", "sign in"],
    },
  );

  return entries;
}

export default function GlobalSearch({ isPrivileged }: { isPrivileged: boolean }) {
  const [open, setOpen] = useState(false);
  const [winners, setWinners] = useState<PastWinner[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isShortcut = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if (isShortcut) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Winner records are small (name/category/department) — safe to keep a live
  // subscription mounted only while the palette is open at least once.
  useEffect(() => {
    if (!open) return;
    const unsub = subscribePastWinners(setWinners);
    return unsub;
  }, [open]);

  const staticEntries = useMemo(() => buildStaticEntries(isPrivileged), [isPrivileged]);

  function go(target: NavTarget) {
    setOpen(false);
    navigate(target as Parameters<typeof navigate>[0]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group hidden items-center gap-2.5 rounded-full border border-primary/15 bg-white/50 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/30 hover:bg-white/70 hover:text-foreground sm:flex"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 shrink-0 text-primary/70" />
        <span className="whitespace-nowrap">Search…</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded-md border border-primary/15 bg-primary/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary/70 md:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 sm:hidden"
        aria-label="Open search"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, award categories, winners…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {staticEntries.map((entry) => (
              <CommandItem
                key={entry.id}
                value={entry.title}
                keywords={entry.keywords}
                onSelect={() => go(entry.target)}
              >
                {entry.icon}
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate">{entry.title}</span>
                  {entry.subtitle && (
                    <span className="truncate text-xs text-muted-foreground">{entry.subtitle}</span>
                  )}
                </div>
                {entry.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Award Categories">
            {AWARD_CATEGORIES.map((cat) => (
              <CommandItem
                key={cat.id}
                value={cat.name}
                keywords={[cat.short, cat.tagline]}
                onSelect={() => go({ to: "/nominate/$categoryId", params: { categoryId: cat.id } })}
              >
                <Award />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate">{cat.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{cat.tagline}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>

          {winners.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Past Winners">
                {winners.slice(0, 25).map((winner) => (
                  <CommandItem
                    key={winner.id}
                    value={`${winner.name} ${winner.year}`}
                    keywords={[winner.categoryName, winner.department ?? "", String(winner.year)]}
                    onSelect={() => go({ to: "/winners", search: { winner: winner.id } })}
                  >
                    <Trophy />
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate">{winner.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {winner.categoryName} · {winner.year}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
