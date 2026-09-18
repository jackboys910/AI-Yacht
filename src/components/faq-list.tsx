/** Accordion of questions, shared by the home and IT Solutions FAQs. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
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
  );
}
