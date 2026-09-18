import { Eyebrow } from "./eyebrow";

const benefits = [
  {
    num: "01",
    title: "A working AI tool",
    text: "By the end of the week you won't have notes or an idea — you'll have a working product built for a specific job in your business.",
  },
  {
    num: "02",
    title: "Vibe coding with no experience",
    text: "You'll learn to assemble tools with AI, even if you've never written a single line of code.",
  },
  {
    num: "03",
    title: "A circle of like-minded people",
    text: "Five other entrepreneurs — plus Ivan and Yasha, who are part of this week too, not just crew on board. Seven people living on the same deck for a week. Connections like that can't be bought.",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="bg-background py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>What you get</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          Three things you&apos;ll take home with you.
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {benefits.map((item) => (
            <div
              key={item.num}
              className="group relative flex flex-col rounded-3xl border border-border bg-card p-8 shadow-card transition hover:-translate-y-1 hover:border-[color:var(--teal)]"
            >
              <span className="font-display text-4xl text-[color:var(--gold)]">
                {item.num}
              </span>
              <h3 className="mt-6 font-display text-2xl">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
