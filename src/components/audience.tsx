import { Eyebrow } from "./eyebrow";

const criteria = [
  "You already run a business with real revenue — you're not testing whether entrepreneurship is for you.",
  "You've heard about AI and vibe coding, but you haven't built anything with your own hands yet.",
  "You don't need another lecture — you need a working tool for your business by the end of the week.",
  "You're ready to spend a week in a small group on the water — no office, no rush.",
  "You value a clear head and focus over parties.",
  "You understand that custom software built for your business usually means a year of development and a $100,000+ budget. We'll build your working tool in one week on board — that's not just saved time and money, it's leverage that can dramatically accelerate your business growth.",
];

export function Audience() {
  return (
    <section className="bg-background py-20 sm:py-32">
      <div className="container-narrow grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <Eyebrow>Who it&apos;s for</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            This is for you,
            <br />
            <span className="text-[color:var(--teal)]">if…</span>
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground">
            We deliberately don&apos;t gather a crowd. Six people — because in a
            week on the water you only get somewhere with those who are already
            playing their own game.
          </p>
        </div>

        <div>
          <ul className="space-y-4">
            {criteria.map((item) => (
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
                    <path
                      d="M4 10.5l4 4 8-9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[15px] leading-relaxed text-foreground/90">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border-l-4 border-[color:var(--gold)] bg-muted/60 p-5 text-sm leading-relaxed text-foreground/80">
            This is <span className="font-semibold text-foreground">not</span>{" "}
            for anyone looking for a beach holiday, or who wants to learn to code
            from scratch for the sake of coding itself.
          </div>
        </div>
      </div>
    </section>
  );
}
