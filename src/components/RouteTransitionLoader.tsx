import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function RouteTransitionLoader() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    };

    // Subscribe to route changes
    const unsubscribe = router.subscribe("onBeforeLoad", handleRouteChange);

    return () => {
      unsubscribe?.();
    };
  }, [router]);

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          {/* Soft curtain wash — bridges the outgoing and incoming page */}
          <motion.div
            key="curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-primary via-primary to-primary"
            style={{
              backgroundSize: "200% 100%",
              animation: "loading-bar 1.5s ease-in-out",
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
