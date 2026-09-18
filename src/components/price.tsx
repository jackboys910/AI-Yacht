import { Eyebrow } from "./eyebrow";

export function Price() {
  return (
    <section
      id="price"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-28"
    >
      <img
        src="/assets/sunset-cat.jpg"
        alt=""
        width={1600}
        height={900}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/85 to-primary" />

      <div className="container-narrow relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tone="light">Price</Eyebrow>

          <p className="mt-8 font-display text-5xl leading-none sm:text-7xl">
            <span className="text-[color:var(--gold)]">$3,500</span>
            <span className="mt-3 block text-2xl font-medium text-white/90 sm:text-3xl">
              per seat. Only 6 seats.
            </span>
          </p>

          <div className="mx-auto mt-10 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--gold)]" />
            <span className="font-medium">6 of 6 seats available</span>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Flights and accommodation on the first / last day are not included.
            If that number gives you pause — this may not be your format, and
            that&apos;s fine.
          </p>

          <a
            href="#apply"
            className="mt-10 inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] px-8 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110"
          >
            Reserve your seat
          </a>
        </div>
      </div>
    </section>
  );
}
