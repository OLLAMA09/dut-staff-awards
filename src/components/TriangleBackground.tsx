import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DUT-inspired triangle background.
 *
 * Every cell is a square split along a diagonal into two right-angled
 * triangles – the same shape language as the DUT logo mark. A triangle
 * "blooms" into one of the DUT brand colours and the colour ripples outward
 * to its neighbours like a cascade – echoing the staircase in the logo.
 *
 * Blooms are triggered by the pointer (tracked on window, so it works even
 * when the grid sits behind page content) and by an autoplay loop so the
 * pattern stays alive on its own.
 */

const DUT_COLORS = [
  "#8FC3C4", // teal
  "#8B2A7C", // plum
  "#2E8B57", // green
  "#D7263D", // red
  "#4B5BA6", // indigo
  "#C77DB5", // orchid
] as const;

// Four diagonal orientations, like the mixed triangles in the logo
type Orientation = "tl" | "tr" | "bl" | "br";
const ORIENTATIONS: Orientation[] = ["tl", "tr", "bl", "br"];
const CLIP: Record<Orientation, string> = {
  tl: "polygon(0 0, 100% 0, 0 100%)",
  tr: "polygon(0 0, 100% 0, 100% 100%)",
  bl: "polygon(0 0, 0 100%, 100% 100%)",
  br: "polygon(100% 0, 100% 100%, 0 100%)",
};
const PAIR: Record<Orientation, Orientation> = { tl: "br", tr: "bl", bl: "tr", br: "tl" };

// Is a point (fractions within the cell) inside the triangle with this orientation?
const inside = (o: Orientation, x: number, y: number) =>
  o === "tl" ? x + y < 1 : o === "br" ? x + y >= 1 : o === "tr" ? y < x : y >= x;

// Deterministic pseudo-random so SSR and client agree
const hash = (r: number, c: number) => {
  const x = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Pull a brand colour toward the site's slate-blue so it sits in the palette
const blend = (color: string, amount: number) =>
  `color-mix(in oklab, ${color} ${amount}%, oklch(0.55 0.045 258))`;
const alpha = (color: string, amount: number) =>
  `color-mix(in oklab, ${color} ${amount}%, transparent)`;

type Lit = { color: string; delay: number; id: number };

type TriangleBackgroundProps = React.ComponentProps<"div"> & {
  /** Size of each square cell (two triangles) in px */
  cellSize?: number;
  /** Gap between cells in px */
  gap?: number;
  /** How far a ripple spreads (in cells) */
  rippleRadius?: number;
  /** "subtle" for full-page backgrounds, "vivid" for decorative banners */
  tone?: "subtle" | "vivid";
  /** Autoplay interval in ms (0 disables) */
  autoplay?: number;
  /** Random blooms, or a staircase that walks down the grid */
  pattern?: "random" | "cascade";
};

const Tri = React.memo(function Tri({
  clip,
  rest,
  lit,
}: {
  clip: string;
  rest: string;
  lit?: Lit;
}) {
  return (
    <div
      className="tri absolute inset-0"
      style={{
        clipPath: clip,
        // tiny inset so the diagonal reads as a hairline gap
        transform: lit ? "scale(0.97)" : "scale(0.9)",
        backgroundColor: lit ? lit.color : rest,
        transition: lit
          ? `background-color 220ms ease ${lit.delay}ms, transform 260ms cubic-bezier(.2,.9,.3,1.4) ${lit.delay}ms`
          : "background-color 900ms ease, transform 600ms ease",
      }}
    />
  );
});

function TriangleBackground({
  className,
  children,
  cellSize = 56,
  gap = 4,
  rippleRadius = 2,
  tone = "subtle",
  autoplay = 1400,
  pattern = "random",
  ...props
}: TriangleBackgroundProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [grid, setGrid] = React.useState({ rows: 0, cols: 0 });
  const [lit, setLit] = React.useState<Map<string, Lit>>(() => new Map());
  const timeouts = React.useRef(new Set<number>());
  const nextId = React.useRef(0);
  const lastHover = React.useRef("");
  const walker = React.useRef({ row: 0, col: 0, dir: 1 });

  const step = cellSize + gap;

  const orientationAt = React.useCallback(
    (row: number, col: number) => ORIENTATIONS[Math.floor(hash(row, col) * 4)],
    [],
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // A hidden element (e.g. banners below xl) gets an empty grid, which also pauses autoplay
    const measure = () =>
      setGrid(
        el.clientWidth && el.clientHeight
          ? {
              rows: Math.ceil(el.clientHeight / step) + 1,
              cols: Math.ceil(el.clientWidth / step) + 1,
            }
          : { rows: 0, cols: 0 },
      );
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  React.useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const bloom = React.useCallback(
    (row: number, col: number, half: 0 | 1, radius = rippleRadius) => {
      const base = DUT_COLORS[Math.floor(hash(row, col + half) * DUT_COLORS.length)];
      const color = tone === "vivid" ? base : blend(base, 72);
      const id = ++nextId.current;
      const keys: string[] = [];

      setLit((prev) => {
        const next = new Map(prev);
        // Diamond-shaped ripple out from the origin triangle
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const dist = Math.abs(dr) + Math.abs(dc);
            if (dist > radius) continue;
            // Only colour alternating halves so the cascade reads as a staircase
            const h = dist === 0 ? half : (((half + dist) % 2) as 0 | 1);
            const key = `${row + dr}-${col + dc}-${h}`;
            keys.push(key);
            next.set(key, { color, delay: dist * 70, id });
          }
        }
        return next;
      });

      const t = window.setTimeout(
        () => {
          timeouts.current.delete(t);
          setLit((prev) => {
            const next = new Map(prev);
            // Leave cells that a newer ripple has since claimed
            for (const k of keys) if (next.get(k)?.id === id) next.delete(k);
            return next;
          });
        },
        1100 + radius * 70,
      );
      timeouts.current.add(t);
    },
    [rippleRadius, tone],
  );

  // Pointer tracking on window: the grid usually sits behind content
  React.useEffect(() => {
    if (!grid.rows) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el || e.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - gap / 2;
      const y = e.clientY - rect.top - gap / 2;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        lastHover.current = "";
        return;
      }
      const col = Math.floor(x / step);
      const row = Math.floor(y / step);
      const fx = (x - col * step) / cellSize;
      const fy = (y - row * step) / cellSize;
      if (fx > 1 || fy > 1) return; // in the gap
      const half: 0 | 1 = inside(orientationAt(row, col), fx, fy) ? 0 : 1;
      const key = `${row}-${col}-${half}`;
      if (key === lastHover.current) return;
      lastHover.current = key;
      bloom(row, col, half);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [grid.rows, step, gap, cellSize, bloom, orientationAt]);

  // Autoplay so the pattern is alive without interaction
  React.useEffect(() => {
    if (!autoplay || !grid.rows || !grid.cols) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tick = () => {
      if (document.hidden) return;
      if (pattern === "cascade") {
        // A staircase that steps down-and-across, bouncing off the edges
        const w = walker.current;
        bloom(w.row, w.col, (w.row % 2) as 0 | 1, Math.max(1, rippleRadius - 1));
        w.row = (w.row + 1) % grid.rows;
        w.col += w.dir;
        if (w.col <= 0 || w.col >= grid.cols - 2) w.dir *= -1;
        w.col = Math.max(0, Math.min(grid.cols - 2, w.col));
        // Occasional sparkle elsewhere for variety
        if (Math.random() < 0.35) {
          bloom(
            Math.floor(Math.random() * grid.rows),
            Math.floor(Math.random() * grid.cols),
            Math.random() < 0.5 ? 0 : 1,
            1,
          );
        }
      } else {
        bloom(
          Math.floor(Math.random() * grid.rows),
          Math.floor(Math.random() * grid.cols),
          Math.random() < 0.5 ? 0 : 1,
        );
      }
    };
    tick();
    const id = window.setInterval(tick, autoplay);
    return () => window.clearInterval(id);
  }, [autoplay, pattern, grid.rows, grid.cols, bloom, rippleRadius]);

  const cells = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const a = orientationAt(row, col);
      const halves: [Orientation, Orientation] = [a, PAIR[a]];
      cells.push(
        <div
          key={`${row}-${col}`}
          className="absolute"
          style={{ left: col * step, top: row * step, width: cellSize, height: cellSize }}
        >
          {halves.map((o, half) => {
            const rest =
              tone === "vivid"
                ? alpha(DUT_COLORS[Math.floor(hash(row + 7, col + half) * DUT_COLORS.length)], 22)
                : "oklch(1 0 0 / 0.055)";
            return (
              <Tri key={half} clip={CLIP[o]} rest={rest} lit={lit.get(`${row}-${col}-${half}`)} />
            );
          })}
        </div>,
      );
    }
  }

  return (
    <div
      ref={ref}
      data-slot="triangle-background"
      className={cn("relative size-full overflow-hidden", className)}
      {...props}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-slot="triangle-background"] .tri { transition: none !important; }
        }
      `}</style>

      <div aria-hidden className="absolute inset-0" style={{ margin: gap / 2 }}>
        {cells}
      </div>

      {children}
    </div>
  );
}

export { TriangleBackground, DUT_COLORS, type TriangleBackgroundProps };
