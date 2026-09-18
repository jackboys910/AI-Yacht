import { Eyebrow } from "./eyebrow";

const faqs = [
  {
    q: "Do I need programming experience?",
    a: "No. The format is designed for entrepreneurs without code. We work through vibe coding — you describe what you want to get, and you assemble the product with AI tools.",
  },
  {
    q: "What is included in the $3,500?",
    a: "7 days on the catamaran, the bootcamp programme, the captain's work, marina berths, fuel, and basic meals on board. Flights and accommodation on the buffer days ashore are separate — we'll confirm the final list closer to the date.",
  },
  {
    q: "Do I need a visa?",
    a: "Grenada and Saint Vincent are visa-free for holders of many passports, including Russian ones. We'll send a document checklist once your application is confirmed.",
  },
  {
    q: "How safe is it?",
    a: "The captain is Yasha, an engineer with long-passage experience. The catamaran carries standard certification, there is safety equipment on board, and we keep the route flexible in case of wind.",
  },
  {
    q: "What about hurricane season?",
    a: "The programme sits in a statistically safe window for this region. The official hurricane season in the southern Caribbean winds down by mid-November — we chose these dates deliberately.",
  },
  {
    q: "Can I drink? Can I not?",
    a: "Both are fine. Wine or beer with dinner is up to you. But the day's programme is built around a clear head, not around the bar. This is not a party on the water.",
  },
];

export function Faq() {
  return (
    <section className="bg-background py-20 sm:py-32">
      <div className="container-narrow grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            The questions
            <br />
            we get asked most often.
          </h2>
          <div className="mt-8 aspect-[4/5] overflow-hidden rounded-3xl">
            <img
              src="/assets/islands.jpg"
              alt="The Grenadines"
              width={1400}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                <span className="font-display text-lg leading-snug sm:text-xl">
                  {item.q}
                </span>
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-[color:var(--teal)] transition group-open:rotate-45">
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
