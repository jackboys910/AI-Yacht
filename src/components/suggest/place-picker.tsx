"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Locale } from "@/i18n/config";
import { fieldClass } from "../form-fields";
import { suggestCopy } from "./suggest-copy";

/**
 * "Destination or location": a line to type, and a map to point at.
 *
 * Typing stays first. Most people know what they want to write — "Lofoten",
 * "somewhere in the Alps" — and a map that has to be opened before the field
 * can be filled would be a step added to every idea for the sake of a few.
 * The map is the second way in, for the destination that has a position but
 * no name anybody would type: a marina, a dropzone, a bay.
 *
 * What the map adds to the record is the coordinates. "Glastonbury" is four
 * towns in three countries, and the owner has to know which one before he can
 * judge the idea at all.
 */

const MapPanel = dynamic(() => import("./map-panel"), {
  ssr: false,
  loading: () => (
    <p className="mt-3 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-6 text-center text-sm text-white/50">
      …
    </p>
  ),
});

export function PlacePicker({
  locale,
  value,
  point,
  onChange,
  disabled,
}: {
  locale: Locale;
  value: string;
  /** Set once the map has been used; cleared when the line is retyped. */
  point: { lat: number; lng: number } | null;
  onChange: (place: string, point: { lat: number; lng: number } | null) => void;
  disabled?: boolean;
}) {
  const f = suggestCopy.form;
  const [open, setOpen] = useState(false);

  return (
    <div>
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-widest text-white/60">
          {f.place[locale]}
        </span>
        <input
          name="place"
          value={value}
          disabled={disabled}
          placeholder={f.placePlaceholder[locale]}
          // Typing over a line that came from the map makes the coordinates
          // a claim about somewhere else, so they go.
          onChange={(event) => onChange(event.target.value, null)}
          className={fieldClass}
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((shown) => !shown)}
          className="text-sm text-[color:var(--gold)] underline decoration-[color:var(--gold)]/40 underline-offset-4 transition hover:decoration-[color:var(--gold)]"
        >
          {open ? f.placeHideMap[locale] : f.placeOnMap[locale]}
        </button>

        {point && (
          <span className="text-xs text-white/45">
            {f.placeChosen[locale]}: {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
          </span>
        )}
      </div>

      {open && (
        <MapPanel
          locale={locale}
          start={point ?? undefined}
          onPick={(place, lat, lng) => {
            onChange(place, { lat, lng });
            setOpen(false);
          }}
        />
      )}

      {point && (
        <>
          <input type="hidden" name="placeLat" value={point.lat} readOnly />
          <input type="hidden" name="placeLng" value={point.lng} readOnly />
        </>
      )}
    </div>
  );
}
