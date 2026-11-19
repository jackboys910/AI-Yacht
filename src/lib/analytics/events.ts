import { consent } from "./consent";
import { newEventId, pixelConfigured, trackEvent } from "./pixel";

/**
 * The four events ТЗ asks the pixel to record (Ш-06): a subscription,
 * "I'm interested", a trip application and a Solutions enquiry.
 *
 * Each one is reported twice — once from this browser and once from the
 * Worker through the Conversions API — with the same `eventId`, so Facebook
 * keeps one of them. §11.1 of the spec says why the pair is worth the
 * trouble: the browser copy is lost to ad blockers and to Apple's limits on
 * iPhones often enough that advertising stops being able to tell which clicks
 * turned into subscribers.
 *
 * Standard names where one fits, a custom name where none does. "Interested"
 * is not a standard Facebook event and inventing a mapping for it — `Lead`,
 * say — would merge it in the reports with the thing it is deliberately
 * cheaper than.
 */

export type SiteEvent = "subscribe" | "interested" | "application" | "solutions";

interface Mapping {
  /** What Facebook calls it. */
  name: string;
  /** Whether it has to go through `trackCustom`. */
  custom?: boolean;
}

const EVENTS: Record<SiteEvent, Mapping> = {
  subscribe: { name: "Subscribe" },
  interested: { name: "Interested", custom: true },
  application: { name: "SubmitApplication" },
  solutions: { name: "Lead" },
};

export interface EventDetails {
  /** Hashed by the Worker before it reaches Facebook, never sent as it is. */
  email?: string;
  /** A trip, a direction, a kind of project — whatever names this one. */
  contentName?: string;
  contentCategory?: string;
}

/**
 * Reports one event through both channels.
 *
 * Deliberately not awaited by its callers and deliberately unable to fail
 * loudly: a form that has already been accepted must not show an error
 * because an advertising counter did not answer. Everything inside is
 * guarded, and the server half is sent with `keepalive` so that it survives
 * the page being closed right after the button.
 */
export function reportEvent(event: SiteEvent, details: EventDetails = {}): void {
  if (!pixelConfigured) return;
  if (consent() !== "granted") return;

  const mapping = EVENTS[event];
  const eventId = newEventId();

  const params: Record<string, unknown> = {};
  if (details.contentName) params.content_name = details.contentName;
  if (details.contentCategory) params.content_category = details.contentCategory;

  trackEvent(mapping.name, params, eventId, mapping.custom);

  try {
    void fetch("/api/capi", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event,
        eventId,
        sourceUrl: window.location.href,
        email: details.email,
        contentName: details.contentName,
        contentCategory: details.contentCategory,
      }),
    }).catch(() => {
      // The browser copy has gone either way; a failed server copy costs
      // accuracy in a report, not anything the visitor should hear about.
    });
  } catch {
    // Same.
  }
}

/** What the Worker is allowed to be asked for, shared with it by name. */
export const SITE_EVENTS: SiteEvent[] = [
  "subscribe",
  "interested",
  "application",
  "solutions",
];
