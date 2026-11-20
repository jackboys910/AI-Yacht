"use client";

import { useCallback, useSyncExternalStore } from "react";
import { collections, firebaseConfig, isFirebaseConfigured } from "./config";

/**
 * The "Interested" numbers, read again in the browser (§6.3).
 *
 * The site is printed ahead of time, so every number in the HTML is as old as
 * the last build. For most of the page that is fine — nothing changes without
 * the owner pressing something, and pressing it rebuilds the site. This one
 * number is different: a visitor moves it, and there is no build after that.
 * So the page ships the number it was printed with, and asks for the current
 * one as soon as it has loaded. The printed number is what keeps the block
 * from jumping into existence a second later.
 *
 * Read over Firestore's REST API rather than with the SDK. `firebase/firestore`
 * is around a hundred kilobytes of JavaScript, which is a lot to send every
 * visitor so that one number can be a few hours fresher; this is one `fetch`.
 * `counters` is the single collection `firestore.rules` opens to anonymous
 * reads, and it holds nothing but trip ids and counts.
 *
 * One request per page, not one per trip: a list page draws a dozen cards and
 * each asks the same question. The first component to ask starts the request,
 * the rest wait on it, and the answer is published to all of them at once.
 */

const ENDPOINT =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
  `/databases/(default)/documents/${collections.counters}` +
  `?pageSize=300&key=${firebaseConfig.apiKey}`;

/** What the browser has learned since the page loaded. */
const live = new Map<string, number>();
const listeners = new Set<() => void>();

let asked = false;

function announce(): void {
  for (const listener of listeners) listener();
}

/** `{"integerValue": "7"}` and `{"doubleValue": 7}` both mean seven. */
function readNumber(field: unknown): number | null {
  if (typeof field !== "object" || field === null) return null;
  const value = field as Record<string, unknown>;
  const raw = value.integerValue ?? value.doubleValue;
  const parsed = typeof raw === "string" ? Number(raw) : raw;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? Math.max(0, Math.round(parsed))
    : null;
}

/**
 * After the page has drawn itself, not during.
 *
 * The numbers are already on the page — the build printed them — so this
 * request refreshes something the visitor can already read. Starting it while
 * the page is still painting made it compete for the connection and the main
 * thread with the first screen, and on a throttled mobile profile that is
 * worth points of Lighthouse performance (Т-01). An idle callback with a
 * timeout keeps the refresh prompt without putting it first.
 */
function whenIdle(work: () => void): void {
  if (typeof window === "undefined") {
    work();
    return;
  }
  const idle = window.requestIdleCallback;
  if (typeof idle === "function") idle(work, { timeout: 2500 });
  else window.setTimeout(work, 1200);
}

async function load(): Promise<void> {
  try {
    // Low priority for the same reason: nothing on the page is waiting for it.
    const response = await fetch(ENDPOINT, { cache: "no-store", priority: "low" });
    if (!response.ok) return;

    const body = (await response.json()) as {
      documents?: { name?: string; fields?: Record<string, unknown> }[];
    };

    let changed = false;
    for (const document of body.documents ?? []) {
      const tripId = document.name?.split("/").pop();
      const count = readNumber(document.fields?.interested);
      if (!tripId || count === null) continue;
      if (live.get(tripId) !== count) {
        live.set(tripId, count);
        changed = true;
      }
    }
    if (changed) announce();
  } catch {
    // The page keeps the numbers it was printed with. A counter that could
    // not be refreshed is not worth a message to the visitor — they never
    // asked for it.
  }
}

/**
 * What the button learned the moment it was pressed.
 *
 * Published rather than re-read: the Worker has just counted the records and
 * answered with the result, and asking Firestore again would be a second
 * round trip for a number we already have.
 */
export function publishInterested(tripId: string, count: number): void {
  if (live.get(tripId) === count) return;
  live.set(tripId, count);
  announce();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // The first component to subscribe starts the one request this page makes,
  // once the browser has nothing more urgent to do.
  if (!asked && isFirebaseConfigured) {
    asked = true;
    whenIdle(() => void load());
  }

  return () => {
    listeners.delete(listener);
  };
}

/**
 * The current "Interested" count of a trip, starting from the printed one.
 *
 * `useSyncExternalStore` rather than `useState` plus an effect, because the
 * server and the first client render have to agree: both return `printed`,
 * and the live value replaces it only once it has arrived. Anything else is
 * a hydration mismatch on every trip page.
 */
export function useInterested(tripId: string, printed: number): number {
  const snapshot = useCallback(() => live.get(tripId) ?? printed, [tripId, printed]);
  const server = useCallback(() => printed, [printed]);
  return useSyncExternalStore(subscribe, snapshot, server);
}
