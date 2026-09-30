/**
 * console.log for local development only. Several helpers trace their work on every
 * render (document validation, judging status, admin stats), which floods the browser
 * console on the deployed site; there this does nothing.
 */
export const debugLog: (...args: unknown[]) => void = import.meta.env.DEV
  ? (...args) => console.log(...args)
  : () => {};
