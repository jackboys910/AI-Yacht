import { Eyebrow } from "./eyebrow";

const days = [
  {
    day: "Day 1",
    date: "Nov 12",
    place: "Grenada, St. George's",
    text: "Arrival, check-in on land, dinner, an unhurried introduction.",
  },
  {
    day: "Day 2",
    date: "Nov 13",
    place: "Grenada",
    text: "Half a day of kick-off session, the second half — moving aboard the catamaran.",
  },
  {
    day: "Day 3",
    date: "Nov 14",
    place: "Carriacou",
    text: "First passage at sea, evening workshop at anchor.",
  },
  {
    day: "Day 4",
    date: "Nov 15",
    place: "Union Island",
    text: "Work from the morning, lunch on the water, case reviews in the marina.",
  },
  {
    day: "Day 5",
    date: "Nov 16",
    place: "Tobago Cays",
    text: "A day in the marine reserve: snorkelling + focus sessions.",
  },
  {
    day: "Day 6",
    date: "Nov 17",
    place: "Canouan",
    text: "Prototype sprint, evening in the bay.",
  },
  {
    day: "Day 7",
    date: "Nov 18",
    place: "Mustique / Bequia",
    text: "Final product assembly, presentations on board.",
  },
  {
    day: "Day 8",
    date: "Nov 19",
    place: "Bequia",
    text: "Retro, a buffer day in case of wind, dinner ashore.",
  },
  {
    day: "Day 9",
    date: "Nov 20",
    place: "Saint Vincent",
    text: "Passage to Kingstown, going ashore, hotel.",
  },
  {
    day: "Day 10",
    date: "Nov 21–22",
    place: "Saint Vincent",
    text: "Quiet rest and the flight home.",
  },
];

export function Route() {
  return (
    <section id="route" className="bg-background py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>Route</Eyebrow>
        <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight sm:text-5xl">
          The route, day by day.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          The exact route is adjusted for the wind, but these are the anchor
          points.
        </p>

        <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-4 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible lg:grid-cols-5">
          {days.map((item) => (
            <div
              key={item.day}
              className="min-w-[78%] shrink-0 snap-start rounded-2xl border border-border bg-card p-5 md:min-w-0"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xl">{item.day}</span>
                <span className="text-xs text-muted-foreground">
                  {item.date}
                </span>
              </div>
              <div className="mt-2 font-medium text-[color:var(--teal)]">
                {item.place}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Eyebrow>The real chart</Eyebrow>
          <div className="mt-6 grid gap-5 sm:gap-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <img
                src="/assets/map-wide.jpg"
                alt="Overview of the Caribbean basin with the route from Grenada to Saint Vincent"
                loading="lazy"
                className="block w-full"
              />
            </div>
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <img
                src="/assets/map-close.jpg"
                alt="Close-up of the route: Grenada → Grenadines → Saint Vincent"
                loading="lazy"
                className="block w-full"
              />
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            The route on a real nautical chart — a straight-line distance of
            ≈108 nautical miles.
          </p>
        </div>
      </div>
    </section>
  );
}
