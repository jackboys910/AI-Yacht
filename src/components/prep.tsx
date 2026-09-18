import { Eyebrow } from "./eyebrow";

const requirements = [
  {
    title: "A reliable, fast laptop",
    text: "This is your working instrument for the whole week — there is no doing the bootcamp without one. It has to run modern AI tools comfortably and not freeze at the critical moment.",
  },
  {
    title: "Basic AI knowledge",
    text: "We don't spend the group's time on the basics — “what is a prompt” and “how ChatGPT works” need to be known before you step aboard. If you already use AI tools in your work, that's enough.",
  },
];

export function Prep() {
  return (
    <section id="prep" className="bg-background py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>Preparation</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          What we need from you in advance.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {requirements.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border bg-card p-8 shadow-card"
            >
              <h3 className="font-display text-2xl">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border-l-4 border-[color:var(--gold)] bg-muted/60 p-6 text-[15px] leading-relaxed text-foreground/85">
          Once your seat is confirmed we&apos;ll send a short preparation
          programme — work through it at your own pace before you fly out, and
          every hour on board will go into your product instead of into learning
          the basics.
        </div>
      </div>
    </section>
  );
}
