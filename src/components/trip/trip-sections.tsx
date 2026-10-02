import { Eyebrow } from "@/components/eyebrow";
import { FaqList } from "@/components/faq-list";
import type { Locale } from "@/i18n/config";
import { effectiveBookingStatus, goingCount } from "@/lib/content/schedule";
import type { CardsBlock, Settings, Trip } from "@/lib/content/types";
import { DEFAULT_COUNTER_THRESHOLDS } from "@/lib/content/visibility";
import { bookingLabel, pick, pickList } from "@/lib/content/trip-view";

/**
 * The text blocks of a trip page (§6.3).
 *
 * Every component here returns `null` when the owner left its block empty,
 * which is the whole of the rule П-10 checks: an unfilled block produces
 * nothing at all, not a heading over blank space.
 *
 * Headings are fixed English strings from Appendix В on the English side and
 * their Russian counterparts on the other; they are the page's furniture, not
 * content the owner types.
 */

const HEADINGS = {
  seats: { en: "Who's going", ru: "Кто едет" },
  price: { en: "Price", ru: "Цена" },
  included: { en: "What's included", ru: "Что входит" },
  notIncluded: { en: "Not included", ru: "Что не входит" },
  place: { en: "The place", ru: "Место" },
  audience: { en: "Is this trip for you?", ru: "Кому подходит" },
  whatYouGet: { en: "What you get", ru: "Что получишь" },
  prepare: { en: "How to prepare", ru: "Подготовка" },
  program: { en: "Program", ru: "Программа" },
  rules: { en: "Rules & safety", ru: "Формат и правила" },
  faq: { en: "FAQ", ru: "Вопросы и ответы" },
  seatsLeft: { en: "spots left", ru: "мест свободно" },
  going: { en: "going", ru: "едут" },
} as const;

const say = (key: keyof typeof HEADINGS, locale: Locale) => HEADINGS[key][locale];

/**
 * "Who's going" (§6.3).
 *
 * The number of people going appears only once there are enough of them: the
 * spec sets a threshold because a trip that says "1 going" reads worse than one
 * that says nothing. Until the counters of item 2.4 exist, this is what keeps a
 * freshly published trip from announcing "0 going" to its first visitor.
 */
export function TripSeats({
  trip,
  locale,
  today,
  thresholds = DEFAULT_COUNTER_THRESHOLDS,
}: {
  trip: Trip;
  locale: Locale;
  today: string;
  thresholds?: Settings["counterThresholds"];
}) {
  const status = effectiveBookingStatus(trip, today);
  const going = goingCount(trip);
  const showGoing = going >= thresholds.going;

  return (
    <section id="seats" className="bg-background py-14 sm:py-20">
      <div className="container-narrow">
        <Eyebrow>{say("seats", locale)}</Eyebrow>
        <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-6">
          {showGoing && <Figure value={String(going)} label={say("going", locale)} />}
          {status !== "completed" && trip.seatsLeft > 0 && (
            <Figure value={String(trip.seatsLeft)} label={say("seatsLeft", locale)} />
          )}
          <span className="rounded-full border border-border px-4 py-2 text-sm font-medium text-[color:var(--teal)]">
            {bookingLabel(status, locale)}
          </span>
        </div>
      </div>
    </section>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-display text-3xl sm:text-4xl">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  );
}

export function TripPrice({ trip, locale }: { trip: Trip; locale: Locale }) {
  const amount = pick(trip.price?.amount, locale);
  const included = pickList(trip.price?.included, locale);
  const notIncluded = pickList(trip.price?.notIncluded, locale);
  if (!amount && included.length === 0 && notIncluded.length === 0) return null;

  return (
    <section
      id="price"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-28"
    >
      <div className="container-narrow relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tone="light">{say("price", locale)}</Eyebrow>
          {amount && (
            <p className="mt-8 font-display text-5xl leading-none text-[color:var(--gold)] sm:text-7xl">
              {amount}
            </p>
          )}
        </div>

        {(included.length > 0 || notIncluded.length > 0) && (
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {included.length > 0 && (
              <List title={say("included", locale)} items={included} tone="in" />
            )}
            {notIncluded.length > 0 && (
              <List title={say("notIncluded", locale)} items={notIncluded} tone="out" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function List({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "in" | "out";
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur">
      <h3 className="text-sm uppercase tracking-[0.18em] text-white/70">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span
              aria-hidden="true"
              className={tone === "in" ? "text-[color:var(--gold)]" : "text-white/40"}
            >
              {tone === "in" ? "✓" : "—"}
            </span>
            <span className={tone === "in" ? "text-white/90" : "text-white/60"}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TripPlace({ trip, locale }: { trip: Trip; locale: Locale }) {
  const paragraphs = pickList(trip.placeDetails?.paragraphs, locale);
  if (paragraphs.length === 0) return null;

  return (
    <section id="place" className="bg-background py-20 sm:py-28">
      <div className="container-narrow">
        <Eyebrow>{say("place", locale)}</Eyebrow>
        <div className="mt-6 max-w-3xl space-y-5 text-[15px] leading-relaxed text-foreground/85 sm:text-base">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TripAudience({ trip, locale }: { trip: Trip; locale: Locale }) {
  const items = pickList(trip.audience?.items, locale);
  const note = pick(trip.audience?.note, locale);
  if (items.length === 0 && !note) return null;

  return (
    <section id="audience" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-narrow">
        <Eyebrow>{say("audience", locale)}</Eyebrow>
        {items.length > 0 && (
          <ul className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-border bg-card p-5 text-[15px] leading-relaxed"
              >
                <span aria-hidden="true" className="text-[color:var(--teal)]">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        {note && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

export function TripCards({
  block,
  heading,
  id,
  locale,
  dark = false,
}: {
  block: CardsBlock | undefined;
  heading: string;
  id: string;
  locale: Locale;
  dark?: boolean;
}) {
  const cards = (block?.cards ?? []).filter(
    (card) => pick(card.title, locale) || pick(card.text, locale),
  );
  const note = pick(block?.note, locale);
  if (cards.length === 0 && !note) return null;

  return (
    <section
      id={id}
      className={dark ? "bg-muted/40 py-20 sm:py-28" : "bg-background py-20 sm:py-28"}
    >
      <div className="container-narrow">
        <Eyebrow>{heading}</Eyebrow>
        {cards.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <article
                key={index}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                {pick(card.title, locale) && (
                  <h3 className="font-display text-xl leading-snug">
                    {pick(card.title, locale)}
                  </h3>
                )}
                {pick(card.text, locale) && (
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {pick(card.text, locale)}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
        {note && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

export const cardHeadings = {
  whatYouGet: (locale: Locale) => say("whatYouGet", locale),
  prepare: (locale: Locale) => say("prepare", locale),
};

export function TripProgram({ trip, locale }: { trip: Trip; locale: Locale }) {
  const stages = (trip.program?.stages ?? []).filter(
    (stage) => pick(stage.place, locale) || pick(stage.text, locale),
  );
  const note = pick(trip.program?.note, locale);
  if (stages.length === 0 && !note) return null;

  return (
    <section id="program" className="bg-background py-20 sm:py-28">
      <div className="container-narrow">
        <Eyebrow>{say("program", locale)}</Eyebrow>
        {stages.length > 0 && (
          <ol className="mt-10 space-y-5">
            {stages.map((stage, index) => (
              <li
                key={index}
                className="grid gap-3 rounded-2xl border border-border bg-card p-6 sm:grid-cols-[10rem_1fr] sm:gap-8"
              >
                <div>
                  {pick(stage.duration, locale) && (
                    <p className="font-display text-xl">{pick(stage.duration, locale)}</p>
                  )}
                  {pick(stage.place, locale) && (
                    <p className="mt-1 text-sm font-medium text-[color:var(--teal)]">
                      {pick(stage.place, locale)}
                    </p>
                  )}
                </div>
                {pick(stage.text, locale) && (
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {pick(stage.text, locale)}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        {note && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

export function TripRules({ trip, locale }: { trip: Trip; locale: Locale }) {
  const title = pick(trip.rules?.title, locale);
  const text = pick(trip.rules?.text, locale);
  if (!title && !text) return null;

  return (
    <section id="rules" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-narrow">
        <Eyebrow>{say("rules", locale)}</Eyebrow>
        {title && (
          <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight sm:text-4xl">
            {title}
          </h2>
        )}
        {text && (
          <div className="mt-6 max-w-3xl space-y-4 text-[15px] leading-relaxed text-foreground/85">
            {text.split("\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function TripFaq({ trip, locale }: { trip: Trip; locale: Locale }) {
  const items = trip.faq
    .map((item) => ({ q: pick(item.question, locale), a: pick(item.answer, locale) }))
    .filter((item) => item.q && item.a);
  if (items.length === 0) return null;

  return (
    <section id="faq" className="bg-background py-20 sm:py-28">
      <div className="container-narrow max-w-4xl">
        <Eyebrow>{say("faq", locale)}</Eyebrow>
        <div className="mt-8">
          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
