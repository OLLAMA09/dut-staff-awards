import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

/** Navigations that finish faster than this never show the loader, so it doesn't flash. */
const SHOW_AFTER_MS = 150;
/** Once shown, the loader stays at least this long so it doesn't flicker off. */
const MIN_VISIBLE_MS = 400;

/**
 * Full-screen loading page while the router is fetching the next page — its code
 * (the admin and judge pages are large) and any route data. Mounted once in the root
 * layout, so it covers every navigation on the site.
 */
export function RouteTransitionLoader() {
  const pending = useRouterState({ select: (s) => s.status === "pending" });
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (pending) {
      if (visible) return;
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, SHOW_AFTER_MS);
      return () => clearTimeout(timer);
    }
    if (!visible) return;
    const remaining = MIN_VISIBLE_MS - (Date.now() - shownAt.current);
    const timer = setTimeout(() => setVisible(false), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [pending, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="route-loader"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-background/85 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4 text-white">
            <img src="/logo.png" alt="" className="h-12 w-auto rounded-md shadow-elegant" />
            <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden="true" />
            <p className="text-sm font-semibold tracking-wide">Loading…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
