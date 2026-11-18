import type { Settings, SiteContent } from "./types";
import { DEFAULT_COUNTER_THRESHOLDS } from "./visibility";

/**
 * What a page needs to draw the Going / Interested numbers (§6.3).
 *
 * One object rather than two props, because the two always travel together:
 * a count with no threshold would show "1 going", and a threshold with no
 * count has nothing to compare. It passes from the page through the lists to
 * the cards, and every step of that journey is shorter for it.
 *
 * `counts` holds what the counters said when the site was printed. The
 * browser asks for the current numbers once the page has loaded — see
 * `lib/firebase/counters` — and these are what it shows until the answer
 * arrives, so nothing moves on the screen a second after it appears.
 */
export interface CounterSet {
  /** "Interested", by trip id, as printed. */
  counts: Record<string, number>;
  thresholds: Settings["counterThresholds"];
}

export function counterSet(content: SiteContent): CounterSet {
  return {
    counts: Object.fromEntries(
      content.counters.map((counter) => [counter.tripId, counter.interested]),
    ),
    thresholds: content.settings?.counterThresholds ?? DEFAULT_COUNTER_THRESHOLDS,
  };
}

/** The printed count of one trip; zero for a trip nobody has pressed yet. */
export function printedInterest(counters: CounterSet | undefined, tripId: string): number {
  return counters?.counts[tripId] ?? 0;
}

/** The thresholds a page was given, or the ones §6.3 starts from. */
export function thresholdsOf(counters: CounterSet | undefined): Settings["counterThresholds"] {
  return counters?.thresholds ?? DEFAULT_COUNTER_THRESHOLDS;
}
