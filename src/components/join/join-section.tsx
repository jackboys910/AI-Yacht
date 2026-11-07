import type { Locale } from "@/i18n/config";
import { effectiveBookingStatus } from "@/lib/content/schedule";
import type { Trip } from "@/lib/content/types";
import { joinCopy } from "./join-copy";
import { JoinForm } from "./join-form";

/**
 * Where the application form sits on a trip page (plan item 2.8).
 *
 * A section rather than a dialog, unlike the subscription: the subscription
 * is one field and an impulse, this is a page of writing about yourself, and
 * a window is the wrong room for that. It is also what "Book my spot" at the
 * top of the page jumps to, which needs somewhere to land.
 *
 * A trip that has ended or has no seats left shows the reason instead of the
 * form. A form that cannot lead anywhere is worse than no form: it collects
 * hopes and answers none of them.
 */
export function JoinSection({
  trip,
  locale,
  today,
}: {
  trip: Trip;
  locale: Locale;
  today: string;
}) {
  const status = effectiveBookingStatus(trip, today);
  const over = status === "completed";
  const closed = status === "soldOut";

  return (
    <section id="join" className="bg-primary py-16 text-white sm:py-24">
      <div className="container-narrow">
        <h2 className="font-display text-3xl leading-tight sm:text-4xl">
          {joinCopy.heading[locale]}
        </h2>

        {over || closed ? (
          <p className="mt-5 max-w-xl text-white/70">
            {(over ? joinCopy.over : joinCopy.closed)[locale]}
          </p>
        ) : (
          <>
            <p className="mt-5 max-w-2xl text-white/75">{joinCopy.lead[locale]}</p>
            <div className="mt-10">
              <JoinForm tripId={trip.id} locale={locale} kidFriendly={trip.kidFriendly} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
