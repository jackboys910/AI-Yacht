/**
 * Whether this visitor has agreed to advertising cookies (§6.7, П-20).
 *
 * One value in `localStorage`, and the whole of the banner's memory. Three
 * states, not two: nobody has answered yet, they said yes, they said no.
 * "Not answered" has to be its own state because it is the only one that
 * shows the banner, and because it must behave exactly like "no" until it
 * becomes a yes — П-20 is tested by opening the site for the first time and
 * looking at the network tab.
 *
 * Reading and writing are wrapped: in a private window, or with site data
 * blocked, `localStorage` throws on access rather than returning null, and a
 * banner that takes the page down with it is worse than no banner.
 */

const KEY = "nazarov.consent";

export type Consent = "unknown" | "granted" | "denied";

const listeners = new Set<() => void>();

/** Cached, so every component reading it does not touch storage. */
let current: Consent | null = null;

function read(): Consent {
  if (typeof window === "undefined") return "unknown";
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : "unknown";
  } catch {
    return "unknown";
  }
}

export function consent(): Consent {
  current ??= read();
  return current;
}

export function setConsent(value: Exclude<Consent, "unknown">): void {
  current = value;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // A browser that refuses to remember the answer still has to honour it
    // for this visit, and `current` is what the rest of the code reads.
  }
  for (const listener of listeners) listener();
}

export function subscribeToConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * What the server renders, and what the first client render must match.
 *
 * A fourth value, and it means "nobody has looked yet" rather than any
 * answer. The site is printed at build time and `localStorage` is only
 * readable after hydration, so a snapshot of "unknown" here would render the
 * banner into the HTML of every page and then take it away again for the
 * visitor who agreed months ago — a banner that flashes on every page load.
 * "pending" renders nothing, and the real answer arrives a tick later.
 */
export function consentServerSnapshot(): ConsentView {
  return "pending";
}

export type ConsentView = Consent | "pending";
