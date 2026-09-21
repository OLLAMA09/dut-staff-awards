import { Link } from "@tanstack/react-router";
import { ExternalLink, CalendarRange } from "lucide-react";
import { AWARD_CATEGORIES, AWARD_THEME } from "@/data/awards";

const logo = "/logo.png";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-primary/10 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="DUT Logo" className="h-10 w-auto object-contain" />
              <div>
                <p className="text-sm font-semibold leading-tight text-primary">
                  Registrar's Ambit Staff Awards
                </p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  Durban University of Technology
                </p>
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Recognising excellence, celebrating service, and honouring the people who make the
              Registrar's Division exceptional.
            </p>
            <a
              href="https://planet09ai.co.za/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Made by Planet 09 AI <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Explore */}
          <nav aria-label="Explore">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/" hash="categories" className="transition hover:text-primary">
                  Award Categories
                </Link>
              </li>
              <li>
                <Link to="/" hash="event" className="transition hover:text-primary">
                  Event Program
                </Link>
              </li>
              <li>
                <Link to="/" hash="about" className="transition hover:text-primary">
                  About the Awards
                </Link>
              </li>
              <li>
                <Link to="/winners" className="transition hover:text-primary">
                  Past Winners
                </Link>
              </li>
            </ul>
          </nav>

          {/* Award categories */}
          <nav aria-label="Award categories">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Award Categories
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {AWARD_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to="/nominate/$categoryId"
                    params={{ categoryId: cat.id }}
                    className="transition hover:text-primary"
                  >
                    {cat.short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Access */}
          <nav aria-label="Portal access">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Access
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/admin" className="transition hover:text-primary">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/judge" className="transition hover:text-primary">
                  Judge Portal
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="transition hover:text-primary">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-primary/10 pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} Registrar's Ambit Staff Awards · Durban University of Technology. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" /> {AWARD_THEME.recognitionPeriod}
            </span>
            <span className="hidden text-primary sm:inline">#RegistrarsAmbit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
