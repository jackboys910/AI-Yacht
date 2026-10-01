"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { todayUtc } from "@/lib/content/schedule";
import type { Person } from "@/lib/content/types";
import type { TripDraft } from "@/lib/firebase/trips";
import { TripPage } from "@/views/trip-page";
import { LocaleTabs } from "../fields";

/**
 * А-07: the trip as visitors will see it, drawn from the draft.
 *
 * It is not a mock-up of the page — it is the page component, handed the form's
 * current values instead of a database record. That is the whole point: a
 * preview built separately would drift from the real thing, and the owner would
 * find out after publishing.
 *
 * It also means the preview costs nothing to produce. Publishing waits on a
 * rebuild of the site (§3.1 of the plan, criteria А-08 and А-09), but seeing
 * the result does not.
 */
export function TripPreview({
  draft,
  id,
  people,
  interestSlug,
  onClose,
}: {
  draft: TripDraft;
  id: string | null;
  people: Person[];
  interestSlug: string;
  onClose: () => void;
}) {
  const [locale, setLocale] = useState<Locale>("en");

  const trip = { ...draft, id: id ?? "preview", createdAt: "", updatedAt: "" };
  const crew = draft.crewPersonIds
    .map((personId) => people.find((person) => person.id === personId))
    .filter((person): person is Person => Boolean(person));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-between gap-3 bg-[color:var(--primary)] px-4 py-3 text-white">
        <span className="text-sm">
          Предпросмотр — так поездку увидят посетители.{" "}
          <span className="text-white/60">Черновик, на сайте его ещё нет.</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/10 p-0.5">
            <LocaleTabs value={locale} onChange={setLocale} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-medium transition hover:border-white"
          >
            Вернуться к форме
          </button>
        </div>
      </div>

      <TripPage
        trip={trip}
        people={crew}
        locale={locale}
        today={todayUtc()}
        interestSlug={interestSlug}
      />
    </div>
  );
}
