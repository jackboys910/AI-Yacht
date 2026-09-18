export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate min-h-[100svh] overflow-hidden bg-primary text-white"
    >
      <img
        src="/assets/hero-catamaran.jpg"
        alt="Catamaran in the Caribbean Sea"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-primary" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-transparent to-transparent" />

      <div className="container-narrow relative flex min-h-[100svh] flex-col justify-end pb-16 pt-32 sm:pb-24 sm:pt-40">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />
            November 12–22, 2026 · Caribbean
          </div>

          <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl md:text-7xl">
            10 days in the Caribbean Sea.
            <span className="mt-3 block text-[color:var(--gold)]">
              7 of them aboard a catamaran,
            </span>
            <span className="mt-2 block text-white/95">
              and a working AI product for your business at the end.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base text-white/80 sm:text-lg">
            A closed group of 6 entrepreneurs. November 12–22, 2026.{" "}
            <span className="text-white">
              Grenada → Grenadines → Saint Vincent.
            </span>
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#apply"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] px-8 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110 active:scale-[0.98]"
            >
              Apply now
            </a>
            <a
              href="#price"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-8 py-4 text-base font-medium text-white transition hover:border-white/60"
            >
              $3,500 · 6 seats
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
