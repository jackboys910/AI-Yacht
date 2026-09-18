import "./globals.css";
import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { pagePath } from "@/i18n";

export const metadata: Metadata = {
  title: "404 — AI Yacht",
  description: "This page does not exist.",
};

// Rendered for any URL that matches no route. It sits outside both locale
// layouts, so it speaks both languages and links to both home pages.
export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <main className="relative isolate grid min-h-[100svh] place-items-center overflow-hidden bg-primary px-5 text-center text-white">
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
                Back to AI Yacht
              </a>
              <a
                href={pagePath("home", "ru")}
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-8 py-4 text-base font-medium text-white transition hover:border-white/60"
              >
                На главную (RU)
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
