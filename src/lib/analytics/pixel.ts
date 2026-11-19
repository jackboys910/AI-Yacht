import { consent } from "./consent";

/**
 * The Facebook pixel, the half that lives in the browser (Ш-06, П-20).
 *
 * Two rules, and both are load-bearing:
 *
 *  1. **Nothing happens before consent.** Not the script, not a request to
 *     facebook.com, not a cookie. П-20 is checked by opening the site for the
 *     first time with the network tab open, so the loader is called from one
 *     place — the banner — and only when the answer is yes.
 *  2. **Nothing happens without a pixel id.** The id is the client's, it
 *     arrives as a build variable, and until it does every function here is a
 *     no-op. That is what lets the banner, the events and the server channel
 *     all be built and tested before the advertising account exists.
 *
 * The id is public by design: it travels in the page to every visitor and
 * names an advertising account rather than granting anything. The Conversions
 * API token, which does grant something, is a Worker secret and never appears
 * in a page — see `worker/capi.ts`.
 */

export const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "";

export const pixelConfigured = pixelId.length > 0;

const SCRIPT = "https://connect.facebook.net/en_US/fbevents.js";

type Fbq = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
  callMethod?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let started = false;

/**
 * Loads the pixel and records the page view.
 *
 * Idempotent: the banner calls it on consent, and every page thereafter calls
 * it on mount. The second call through `fbq("track", "PageView")` is what a
 * single-page navigation needs; here every page is its own document, so the
 * guard mostly protects against two components mounting in one render.
 */
export function startPixel(): void {
  if (!pixelConfigured || typeof window === "undefined") return;
  if (consent() !== "granted") return;

  if (!started) {
    started = true;
    installStub();

    const script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT;
    document.head.appendChild(script);

    window.fbq?.("init", pixelId);
  }

  window.fbq?.("track", "PageView");
}

/**
 * The queue Facebook's own snippet installs.
 *
 * Written out rather than pasted as a minified blob so that what it does can
 * be read: calls made before the script arrives are kept in `queue` and
 * replayed by the script once it loads.
 */
function installStub(): void {
  if (window.fbq) return;

  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  } as Fbq;

  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;

  window.fbq = fbq;
  window._fbq = fbq;
}

/**
 * One event, in the browser half of the pair.
 *
 * `eventID` is the whole point of the signature: the same id goes to the
 * Worker, which sends the same event server-side, and Facebook throws away
 * whichever copy arrives second. Without it a subscription that reaches both
 * channels is counted twice, and the cost per subscriber in the report is
 * half of what it really was.
 */
export function trackEvent(
  name: string,
  params: Record<string, unknown>,
  eventId: string,
  custom = false,
): void {
  if (!pixelConfigured || typeof window === "undefined") return;
  if (consent() !== "granted") return;

  startPixel();
  window.fbq?.(custom ? "trackCustom" : "track", name, params, { eventID: eventId });
}

/** An id both channels can agree on; random is enough, it is only a key. */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
