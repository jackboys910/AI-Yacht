"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/i18n/config";
import { suggestCopy } from "./suggest-copy";

/**
 * The map behind "Choose on the map" (asked for by the client, 24.11.2026).
 *
 * OpenStreetMap through Leaflet, and both choices are about what the site is
 * willing to depend on. The tiles need no account, no key and no billing
 * card, so nothing here stops working the day a free tier changes; Leaflet
 * draws them in forty kilobytes and has no dependencies of its own.
 *
 * This file is loaded only when the map is opened. Nothing of it — not the
 * library, not its stylesheet, not one tile — is fetched for a visitor who
 * never presses the button, which is also why no request reaches
 * openstreetmap.org until somebody deliberately asks for a map.
 *
 * The pin is the middle of the screen rather than a marker to drag, and that
 * is deliberate too: dragging a marker with a thumb means covering it with
 * the thumb. The visitor moves the map under a fixed pin, which is how every
 * map application on a phone asks for a point.
 */

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const NOMINATIM = "https://nominatim.openstreetmap.org";

interface Found {
  name: string;
  lat: number;
  lng: number;
}

async function ask(path: string): Promise<unknown> {
  const response = await fetch(`${NOMINATIM}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`nominatim ${response.status}`);
  return response.json();
}

export default function MapPanel({
  locale,
  start,
  onPick,
}: {
  locale: Locale;
  /** Where to open, when a place was already chosen once. */
  start?: { lat: number; lng: number };
  onPick: (place: string, lat: number, lng: number) => void;
}) {
  const f = suggestCopy.form;
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Found[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    let created: LeafletMap | null = null;

    void import("leaflet").then((L) => {
      if (!live || !box.current || map.current) return;

      created = L.map(box.current, {
        center: start ? [start.lat, start.lng] : [30, 10],
        zoom: start ? 12 : 2,
        // The page scrolls past this panel on a phone, and a map that eats
        // the wheel would trap the scroll inside it. Two fingers, or the
        // buttons, still zoom.
        scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(created);
      map.current = created;

      // The panel opens with a width animation on some screens, and Leaflet
      // measures its container once. Without this the tiles come out half a
      // panel wide.
      setTimeout(() => created?.invalidateSize(), 120);
    });

    return () => {
      live = false;
      created?.remove();
      map.current = null;
    };
    // Opened once per press of the button; `start` is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const text = query.trim();
    if (!text || searching) return;

    setSearching(true);
    setFailed(false);
    try {
      const raw = (await ask(
        `/search?format=jsonv2&limit=5&accept-language=${locale}&q=${encodeURIComponent(text)}`,
      )) as { display_name?: string; lat?: string; lon?: string }[];

      const found = raw
        .filter((one) => one.display_name && one.lat && one.lon)
        .map((one) => ({
          name: String(one.display_name),
          lat: Number(one.lat),
          lng: Number(one.lon),
        }));

      setResults(found);
      const first = found[0];
      if (first) map.current?.setView([first.lat, first.lng], 11);
    } catch {
      setFailed(true);
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  /** The middle of the map, turned into words. */
  async function takeCentre() {
    const current = map.current;
    if (!current || reading) return;

    const { lat, lng } = current.getCenter();
    setReading(true);
    setFailed(false);
    try {
      const raw = (await ask(
        `/reverse?format=jsonv2&accept-language=${locale}&zoom=${Math.min(
          18,
          Math.round(current.getZoom()),
        )}&lat=${lat}&lon=${lng}`,
      )) as { display_name?: string };

      // A point in the middle of an ocean has no name, and the coordinates
      // are still an answer — the owner can put them into any map.
      onPick(
        raw.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat,
        lng,
      );
    } catch {
      setFailed(true);
    } finally {
      setReading(false);
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04]">
      {/* Not a <form>: this panel lives inside the idea form, and a nested
          form is markup the browser quietly reassembles. The input answers
          Enter by itself. */}
      <div className="flex gap-2 p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void search(event);
          }}
          placeholder={f.placeSearchPlaceholder[locale]}
          aria-label={f.placeSearch[locale]}
          className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[color:var(--gold)]"
        />
        <button
          type="button"
          onClick={(event) => void search(event)}
          disabled={searching}
          className="shrink-0 rounded-xl border border-white/25 px-4 text-sm text-white transition hover:border-[color:var(--gold)] disabled:opacity-50"
        >
          {searching ? f.placeSearching[locale] : f.placeSearch[locale]}
        </button>
      </div>

      {results?.length === 0 && (
        <p className="px-3 pb-3 text-xs text-white/55">{f.placeNothing[locale]}</p>
      )}

      {results && results.length > 0 && (
        <ul className="max-h-32 overflow-y-auto px-3 pb-3 text-sm">
          {results.map((one) => (
            <li key={`${one.lat},${one.lng}`}>
              <button
                type="button"
                onClick={() => {
                  map.current?.setView([one.lat, one.lng], 13);
                  setResults(null);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                {one.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <div ref={box} className="h-64 w-full bg-[color:var(--primary)] sm:h-72" />

        {/* The pin, nailed to the middle of the frame. Above the map and deaf
            to the pointer, so dragging under it moves the map. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -ml-3 -mt-7 h-7 w-6 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
        >
          <svg viewBox="0 0 24 28" className="h-full w-full">
            <path
              d="M12 0C5.9 0 1 4.9 1 11c0 8 11 17 11 17s11-9 11-17C23 4.9 18.1 0 12 0z"
              fill="var(--gold)"
            />
            <circle cx="12" cy="11" r="4" fill="var(--primary)" />
          </svg>
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <p className="max-w-xs text-xs leading-relaxed text-white/50">
          {failed ? f.placeFailed[locale] : f.placeDrag[locale]}
        </p>
        <button
          type="button"
          onClick={() => void takeCentre()}
          disabled={reading}
          className="rounded-full bg-[color:var(--gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-50"
        >
          {reading ? f.placeReading[locale] : f.placeUse[locale]}
        </button>
      </div>
    </div>
  );
}
