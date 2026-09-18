import { Eyebrow } from "./eyebrow";

const stages = [
  {
    duration: "1.5 days",
    place: "on land, Grenada",
    text: "Getting to know each other, unhurried. Kick-off session, dinner, the plan for the week.",
  },
  {
    duration: "7 days",
    place: "catamaran, Grenadines",
    text: "Bootcamp + the island route. Every night in a marina or a sheltered bay.",
  },
  {
    duration: "1.5 days",
    place: "on land, Saint Vincent",
    text: "Rest, a debrief of the results, an unhurried flight home.",
  },
];

export function Program() {
  return (
    <section className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>How the programme works</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          10 days, three clear segments.
        </h2>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:gap-6">
          {stages.map((stage, index) => (
            <div
              key={stage.place}
              className="relative rounded-3xl border border-border bg-card p-8"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl text-[color:var(--teal)]">
                  {stage.duration}
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  stage {index + 1}
                </span>
              </div>
              <div className="mt-4 font-medium">{stage.place}</div>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {stage.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
