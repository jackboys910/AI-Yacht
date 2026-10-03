import { Eyebrow } from "@/components/eyebrow";
import { FaqList } from "@/components/faq-list";
import { SectionHead } from "@/components/section-head";
import type { Locale } from "@/i18n/config";
import { effectiveBookingStatus, goingCount } from "@/lib/content/schedule";
import type { CardsBlock, Settings, Trip } from "@/lib/content/types";
import { bookingLabel, pick, pickList, pickOrOther } from "@/lib/content/trip-view";
import { DEFAULT_COUNTER_THRESHOLDS } from "@/lib/content/visibility";

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
 *
 * The look is the AI Yacht page's, which §6.3 asks this template to repeat:
 * the same cards, the same numbering, the same gold-edged note, the same two
 * columns under the questions.
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
  stage: { en: "stage", ru: "этап" },
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
        <SectionHead>{say("place", locale)}</SectionHead>
        <div className="mt-8 max-w-3xl space-y-5 text-[15px] leading-relaxed text-foreground/85 sm:text-base">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The gold-edged aside the AI Yacht page uses for a block's closing remark. */
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-2xl border-l-4 border-[color:var(--gold)] bg-muted/60 p-6 text-[15px] leading-relaxed text-foreground/85">
      {children}
    </div>
  );
}

export function TripAudience({ trip, locale }: { trip: Trip; locale: Locale }) {
  const items = pickList(trip.audience?.items, locale);
  const note = pick(trip.audience?.note, locale);
  if (items.length === 0 && !note) return null;

  return (
    <section id="audience" className="bg-background py-20 sm:py-32">
      <div className="container-narrow grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <SectionHead>{say("audience", locale)}</SectionHead>

        <div>
          {items.length > 0 && (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--teal)] text-white">
                    <svg
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[15px] leading-relaxed text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {note && <Note>{note}</Note>}
        </div>
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
  numbered = false,
}: {
  block: CardsBlock | undefined;
  heading: string;
  id: string;
  locale: Locale;
  dark?: boolean;
  /** "01 02 03" down the cards, as on the "What you get" block. */
  numbered?: boolean;
}) {
  const cards = (block?.cards ?? []).filter(
    (card) => pick(card.title, locale) || pick(card.text, locale),
  );
  const note = pick(block?.note, locale);
  if (cards.length === 0 && !note) return null;

  return (
    <section
      id={id}
      className={dark ? "bg-muted/40 py-20 sm:py-32" : "bg-background py-20 sm:py-32"}
    >
      <div className="container-narrow">
        <SectionHead>{heading}</SectionHead>
        {cards.length > 0 && (
          <div
            className={`mt-12 grid gap-6 ${
              cards.length === 1 ? "" : cards.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            {cards.map((card, index) => (
              <article
                key={index}
                className="group flex flex-col rounded-3xl border border-border bg-card p-8 shadow-card transition hover:-translate-y-1 hover:border-[color:var(--teal)]"
              >
                {numbered && (
                  <span className="font-display text-4xl text-[color:var(--gold)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
                {pick(card.title, locale) && (
                  <h3 className={`fit-words font-display text-2xl ${numbered ? "mt-6" : ""}`}>
                    {pick(card.title, locale)}
                  </h3>
                )}
                {pick(card.text, locale) && (
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    {pick(card.text, locale)}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
        {note && <Note>{note}</Note>}
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
    <section id="program" className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow">
        <SectionHead>{say("program", locale)}</SectionHead>
        {stages.length > 0 && (
          <ol
            className={`mt-12 grid gap-4 md:gap-6 ${
              stages.length === 1 ? "" : stages.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            {stages.map((stage, index) => (
              <li
                key={index}
                className="relative rounded-3xl border border-border bg-card p-8"
              >
                <div className="flex flex-wrap items-baseline gap-3">
                  {pick(stage.duration, locale) && (
                    <span className="font-display text-3xl text-[color:var(--teal)]">
                      {pick(stage.duration, locale)}
                    </span>
                  )}
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    {say("stage", locale)} {index + 1}
                  </span>
                </div>
                {pick(stage.place, locale) && (
                  <div className="mt-4 font-medium">{pick(stage.place, locale)}</div>
                )}
                {pick(stage.text, locale) && (
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {pick(stage.text, locale)}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        {note && <Note>{note}</Note>}
      </div>
    </section>
  );
}

export function TripRules({ trip, locale }: { trip: Trip; locale: Locale }) {
  const title = pick(trip.rules?.title, locale);
  const text = pick(trip.rules?.text, locale);
  if (!title && !text) return null;

  // The AI Yacht page sets this block against a dimmed photograph; the trip's
  // own last picture stands in for the one that used to be hardcoded.
  const backdrop = trip.gallery.at(-1);

  return (
    <section
      id="rules"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-28"
    >
      {backdrop?.url && (
        <img
          src={backdrop.url}
          alt=""
          width={backdrop.width || 1400}
          height={backdrop.height || 1000}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />

      <div className="container-narrow relative grid gap-10 md:grid-cols-[auto_1fr] md:items-center md:gap-14">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-[color:var(--gold)]/50 bg-white/5 backdrop-blur">
          <svg
            viewBox="0 0 48 48"
            className="h-12 w-12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M14 8h20l-3 14a7 7 0 01-7 5.5A7 7 0 0117 22L14 8z" strokeLinejoin="round" />
            <path d="M24 27.5V38" strokeLinecap="round" />
            <path d="M17 40h14" strokeLinecap="round" />
            <path d="M10 10l28 28" stroke="#C99A3C" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <Eyebrow tone="light">{say("rules", locale)}</Eyebrow>
          {title && (
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">{title}</h2>
          )}
          {text && (
            <div className="mt-6 max-w-2xl space-y-4 text-white/85">
              {text
                .split("\n")
                .filter(Boolean)
                .map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function TripFaq({ trip, locale }: { trip: Trip; locale: Locale }) {
  const items = trip.faq
    .filter((item) => pick(item.question, locale) || pick(item.answer, locale))
    .map((item) => ({
      q: pick(item.question, locale),
      a: pick(item.answer, locale),
    }));
  if (items.length === 0) return null;

  // The questions sit beside a photograph on the AI Yacht page. Any picture
  // but the cover will do — the cover is already the first thing on the page.
  const aside = trip.gallery.find((_, index) => index !== trip.coverIndex);

  return (
    <section id="faq" className="bg-background py-20 sm:py-32">
      <div
        className={`container-narrow grid gap-12 lg:gap-20 ${
          aside ? "lg:grid-cols-[1fr_1.4fr]" : ""
        }`}
      >
        <div>
          <SectionHead>{say("faq", locale)}</SectionHead>
          {aside && (
            <div className="mt-8 aspect-[4/5] overflow-hidden rounded-3xl">
              <img
                src={aside.url}
                alt={pickOrOther(aside.alt, locale)}
                width={aside.width || 1400}
                height={aside.height || 1000}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        <FaqList items={items} />
      </div>
    </section>
  );
}
