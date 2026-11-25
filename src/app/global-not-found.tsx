import "./globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { pagePath } from "@/i18n";

export const metadata: Metadata = {
  title: "404 — Nazarov.net",
  description: "This page does not exist.",
  robots: { index: false, follow: true },
};

/**
 * Rendered for any URL that matches no route (Т-06).
 *
 * It sits outside both locale layouts, which is why it speaks both languages
 * at once: the address that missed could have been either, and a page that
 * guessed wrong would be a dead end in the wrong language. So both ways home,
 * and the directions besides — somebody who mistyped a trip’s address is
 * usually after a trip, not the front page.
 *
 * The links are written out rather than read from the database on purpose.
 * This file is one static page for the whole site, it has no language and no
 * content of its own. A build-time read here would tie the 404 page to a
 * database request that must never be the reason somebody sees no page at
 * all — so the list is written out, and it is the only place that has to be
 * edited by hand when the owner renames a direction (24.11.2026: Son became
 * Sidekicks, and Summits joined them).
 */

const DIRECTIONS = [
  { slug: "sailing", en: "Sailing", ru: "Sailing" },
  { slug: "snowboarding", en: "Snowboarding", ru: "Snowboarding" },
  { slug: "skydiving", en: "Skydiving", ru: "Skydiving" },
  { slug: "sidekicks", en: "Sidekicks", ru: "Sidekicks" },
  { slug: "summits", en: "Summits", ru: "Summits" },
];

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <main className="relative isolate grid min-h-[100svh] place-items-center overflow-hidden bg-primary px-5 py-16 text-center text-white">
          <img
            src="/assets/hero-catamaran.jpg"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/70 via-primary/60 to-primary" />
          <div>
            <p className="font-display text-7xl text-[color:var(--gold)] sm:text-9xl">
              404
            </p>
            <h1 className="mt-6 font-display text-2xl sm:text-3xl">
              This page drifted off course.
            </h1>
            <p className="mt-2 text-white/70">Эта страница ушла с курса.</p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={pagePath("home", "en")}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] px-8 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110"
              >
                Back to Nazarov.net
              </a>
              <a
                href={pagePath("home", "ru")}
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-8 py-4 text-base font-medium text-white transition hover:border-white/60"
              >
                На главную (RU)
              </a>
            </div>

            <p className="mt-10 text-xs uppercase tracking-[0.2em] text-white/45">
              Looking for a trip? · Искали поездку?
            </p>
            <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/75">
              {DIRECTIONS.map((direction) => (
                <a
                  key={direction.slug}
                  href={`/${direction.slug}/`}
                  className="hover:text-[color:var(--gold)]"
                >
                  {direction.en}
                </a>
              ))}
              <a href={pagePath("story", "en")} className="hover:text-[color:var(--gold)]">
                Story
              </a>
              <a href={pagePath("itSolutions", "en")} className="hover:text-[color:var(--gold)]">
                Solutions
              </a>
            </nav>
          </div>
        </main>
      </body>
    </html>
  );
}
