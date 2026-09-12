import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Replaces native scroll with Lenis's inertia-smoothed scrolling, site-wide.
 * Lenis drives scroll via native `window.scrollTo` under the hood, so it
 * dispatches real `scroll` events — Framer Motion's `useScroll`/`whileInView`
 * and anchor-hash navigation keep working unmodified, just smoother.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    let frame: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
