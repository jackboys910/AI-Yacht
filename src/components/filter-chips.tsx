"use client";

import type { Locale } from "@/i18n/config";

const ALL = { en: "All", ru: "Все" } as const;

/** The value that stands for "no filter". */
export const ALL_CHIP = "all";

/**
 * The "All · Sailing · Snowboarding · Skydiving · Son" row (§6.1, §6.4).
 *
 * Shared by the home page and the Son tab so the two cannot drift apart. The
 * chips are given, never derived here: each page decides which ones make
 * sense, and both leave out a chip that would lead to an empty list.
 *
 * Tab names stay English in both language versions (§16.1); only "All" is
 * translated, because it is not the name of a tab.
 */
export function FilterChips({
  chips,
  active,
  onChange,
  locale,
}: {
  chips: { slug: string; label: string }[];
  active: string;
  onChange: (slug: string) => void;
  locale: Locale;
}) {
  // One chip plus "All" would filter nothing.
  if (chips.length < 2) return null;

  return (
    <div
      role="group"
      aria-label={locale === "en" ? "Filter by section" : "Фильтр по направлению"}
      className="mt-6 flex flex-wrap gap-2"
    >
      {[{ slug: ALL_CHIP, label: ALL[locale] }, ...chips].map((chip) => (
        <button
          key={chip.slug}
          type="button"
          onClick={() => onChange(chip.slug)}
          aria-pressed={active === chip.slug}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            active === chip.slug
              ? "border-[color:var(--teal)] bg-[color:var(--teal)] text-[color:var(--teal-foreground)]"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
