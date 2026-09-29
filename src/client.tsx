import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

declare global {
  interface Window {
    /** Set by the static HTML shell that scripts/generate-netlify-index.mjs writes for Netlify. */
    __SPA_SHELL__?: boolean;
  }
}

// Same as TanStack Start's default client entry, plus one filter. On Netlify every route is
// served the same static, empty HTML shell rather than server-rendered markup, so hydrating
// it always mismatches and React simply renders the page on the client instead. That's
// expected there, so don't raise it as an uncaught error (React #418) on every page load.
const bootedFromStaticShell = typeof window !== "undefined" && window.__SPA_SHELL__ === true;
const HYDRATION_MISMATCH = /Minified React error #(418|423|425)\b|Hydration failed|while hydrating/;

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onRecoverableError(error) {
        if (bootedFromStaticShell && HYDRATION_MISMATCH.test(String((error as Error)?.message))) {
          return;
        }
        if (typeof reportError === "function") reportError(error);
        else console.error(error);
      },
    },
  );
});
