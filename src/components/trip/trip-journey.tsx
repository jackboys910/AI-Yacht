import { SectionHead } from "@/components/section-head";
import type { Locale } from "@/i18n/config";
import type { Person, Trip } from "@/lib/content/types";
import { pick, pickOrOther } from "@/lib/content/trip-view";

/**
 * The parts of a trip page that carry pictures and people: the day-by-day
 * itinerary, the route map, the gallery and the crew (§6.3).
 *
 * As everywhere on this page, a block the owner left empty renders nothing.
 */

const HEADINGS = {
  route: { en: "Day by day", ru: "Маршрут по дням" },
  map: { en: "Route map", ru: "Карта маршрута" },
  media: { en: "Photos & videos", ru: "Фото и видео" },
  crew: { en: "Your crew", ru: "Команда" },
} as const;

const say = (key: keyof typeof HEADINGS, locale: Locale) => HEADINGS[key][locale];

export function TripRouteDays({ trip, locale }: { trip: Trip; locale: Locale }) {
  const days = (trip.route?.days ?? []).filter(
    (day) => pick(day.place, locale) || pick(day.text, locale),
  );
  const intro = pick(trip.route?.intro, locale);
  if (days.length === 0 && !intro) return null;

  return (
    <section id="route" className="bg-background py-20 sm:py-28">
      <div className="container-narrow">
        <SectionHead>{say("route", locale)}</SectionHead>
        {intro && (
          <p className="mt-6 max-w-2xl text-muted-foreground">{intro}</p>
        )}

        {days.length > 0 && (
          // Horizontally scrolled on a phone, a grid once there is room — the
          // same pattern the existing route section uses.
          <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-4 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible lg:grid-cols-5">
            {days.map((day) => (
              <article
                key={day.number}
                className="min-w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card md:min-w-0"
              >
                {day.photo?.url && (
                  <img
                    src={day.photo.thumbUrl ?? day.photo.url}
                    alt={pickOrOther(day.photo.alt, locale)}
                    width={day.photo.width || 640}
                    height={day.photo.height || 420}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-xl">
                      {locale === "en" ? "Day" : "День"} {day.number}
                    </span>
                    {pick(day.date, locale) && (
                      <span className="text-xs text-muted-foreground">
                        {pick(day.date, locale)}
                      </span>
                    )}
                  </div>
                  {pick(day.place, locale) && (
                    <div className="mt-2 font-medium text-[color:var(--teal)]">
                      {pick(day.place, locale)}
                    </div>
                  )}
                  {pick(day.text, locale) && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {pick(day.text, locale)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function TripMap({ trip, locale }: { trip: Trip; locale: Locale }) {
  const images = (trip.map?.images ?? []).filter((image) => image.url);
  const caption = pick(trip.map?.caption, locale);
  if (images.length === 0 && !caption) return null;

  return (
    <section id="map" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-narrow">
        <SectionHead>{say("map", locale)}</SectionHead>
        {images.length > 0 && (
          <div className="mt-10 grid gap-5 sm:gap-6">
            {images.map((image) => (
              <div
                key={image.url}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
              >
                <img
                  src={image.url}
                  alt={pickOrOther(image.alt, locale)}
                  width={image.width || 1600}
                  height={image.height || 900}
                  loading="lazy"
                  className="block w-full"
                />
              </div>
            ))}
          </div>
        )}
        {caption && (
          <p className="mt-4 text-center text-sm text-muted-foreground">{caption}</p>
        )}
      </div>
    </section>
  );
}

export function TripMedia({ trip, locale }: { trip: Trip; locale: Locale }) {
  const photos = (trip.media?.photos ?? []).filter((photo) => photo.url);
  const videos = (trip.media?.youtubeUrls ?? [])
    .map(youtubeId)
    .filter((id): id is string => Boolean(id));
  if (photos.length === 0 && videos.length === 0) return null;

  return (
    <section id="media" className="bg-background py-20 sm:py-28">
      <div className="container-narrow">
        <SectionHead>{say("media", locale)}</SectionHead>

        {photos.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <img
                key={photo.url}
                src={photo.thumbUrl ?? photo.url}
                alt={pickOrOther(photo.alt, locale)}
                width={photo.width || 640}
                height={photo.height || 420}
                loading="lazy"
                className="h-56 w-full rounded-2xl border border-border object-cover"
              />
            ))}
          </div>
        )}

        {videos.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {videos.map((id) => (
              <div
                key={id}
                className="aspect-video overflow-hidden rounded-2xl border border-border bg-primary"
              >
                {/* youtube-nocookie keeps the embed from setting advertising
                    cookies before the visitor has agreed to anything (§6.7). */}
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${id}`}
                  title="YouTube"
                  loading="lazy"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Accepts the three shapes people actually paste from YouTube. */
function youtubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    if (match) return match[1];
  }
  return /^[\w-]{11}$/.test(trimmed) ? trimmed : null;
}

export function TripCrew({
  trip,
  people,
  locale,
}: {
  trip: Trip;
  people: Person[];
  locale: Locale;
}) {
  const crew = trip.crewPersonIds
    .map((id) => people.find((person) => person.id === id))
    .filter((person): person is Person => Boolean(person));
  if (crew.length === 0) return null;

  return (
    <section id="crew" className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow">
        <SectionHead>{say("crew", locale)}</SectionHead>

        <div className="mt-12 flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8">
          {crew.map((person) => (
            <article
              key={person.id}
              className="group w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card"
            >
              {person.photo?.url && (
                <div className="relative aspect-[4/5] overflow-hidden bg-primary">
                  <img
                    src={person.photo.url}
                    alt={pickOrOther(person.name, locale)}
                    width={person.photo.width || 900}
                    height={person.photo.height || 1200}
                    loading="lazy"
                    className="h-full w-full max-w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="font-display text-3xl text-white">
                      {pickOrOther(person.name, locale)}
                    </h3>
                    {pick(person.role, locale) && (
                      <p className="mt-1 text-sm text-white/80">
                        {pick(person.role, locale)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!person.photo?.url && (
                <div className="p-6 pb-0">
                  <h3 className="font-display text-2xl">
                    {pickOrOther(person.name, locale)}
                  </h3>
                  {pick(person.role, locale) && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pick(person.role, locale)}
                    </p>
                  )}
                </div>
              )}

              {pick(person.bio, locale) && (
                <p className="p-6 text-[15px] leading-relaxed text-foreground/85">
                  {pick(person.bio, locale)}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
