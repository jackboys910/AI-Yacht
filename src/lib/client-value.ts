"use client";

import { useSyncExternalStore } from "react";

/**
 * A value the printed page cannot know, read once the browser has it.
 *
 * The site is a static export: every page is a file written on the day it
 * was built and then served from a cache for as long as nobody rebuilds it.
 * Anything that depends on *now* therefore has two values — the one baked
 * into the file and the real one — and a component that simply reads the
 * real one renders something other than the file it was handed, which is a
 * hydration failure. The calendar had exactly that: opened on a browser
 * whose clock had moved past the build by a few months, React threw #418 and
 * threw the page away rather than hydrating it.
 *
 * `useSyncExternalStore` is the mechanism React provides for this, and the
 * third argument is why: it is the snapshot used while hydrating. React
 * renders what the file says, matches it, and only then re-renders with what
 * the browser says — so the correction is a repaint rather than a crash.
 *
 * Nothing is subscribed to, because nothing changes during a visit: a clock
 * crossing midnight under somebody reading a page is not worth a timer.
 */
const never = () => () => {};

export function useClientValue<T>(read: () => T, printed: T): T {
  return useSyncExternalStore(never, read, () => printed);
}

/** Today in UTC, the way the rest of the site counts days. */
export const todayInBrowserUtc = (): string => new Date().toISOString().slice(0, 10);

/**
 * Today on the visitor's own calendar.
 *
 * Local parts rather than UTC, for the one place it matters: an evening in
 * Connecticut is already tomorrow in Greenwich, and a date field whose floor
 * is tomorrow refuses the date the person is looking at.
 */
export function todayInBrowser(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
