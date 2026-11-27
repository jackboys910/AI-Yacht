"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import maplibregl from "maplibre-gl";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  Marker,
  StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Locale } from "@/i18n/config";
import type { FamilyTree, Route } from "@/lib/family/types";

/**
 * The globe the family's moves are drawn on.
 *
 * MapLibre with its globe projection, so the journey can start in space and
 * come down to a village of forty houses without changing maps on the way.
 * Two sources, neither of which asks for a key, an account or a card:
 *
 *  - NASA's Blue Marble, through GIBS, for the planet seen from far away.
 *    Public domain, and it stops at zoom 8, where it would start to blur —
 *    which is where it fades out;
 *  - OpenFreeMap's vector tiles (OpenStreetMap data) for rivers, borders and
 *    town names once the camera is close.
 *
 * Loaded only when the visitor gets near the section: the library alone is
 * several hundred kilobytes, and a visitor who reads only the tree should
 * not pay for it.
 *
 * The parent owns the story — which step is on screen, whether it plays.
 * This component only obeys: a new `stage` means fly there and draw what
 * that step adds.
 */

const BLUE_MARBLE =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg";
const VECTOR = "https://tiles.openfreemap.org/planet";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

const COLORS: Record<Route["kind"], string> = {
  move: "#e3b55b",
  link: "#f3a6bd",
  rocket: "#ffd479",
};

type LngLat = [number, number];

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/** Where the rocket is drawn pointing; its tip is "up" in the SVG. */
const ROCKET_SVG = `
<svg class="fam-rocket" viewBox="0 0 44 44" aria-hidden="true">
  <g transform="translate(22 22)">
    <path class="fam-rocket-flame" d="M-4 9 Q0 24 4 9 Z" fill="#ff9f3b"/>
    <path class="fam-rocket-flame" d="M-2 9 Q0 18 2 9 Z" fill="#ffe08a"/>
    <path d="M0 -18 C7 -10 7 0 5 9 L-5 9 C-7 0 -7 -10 0 -18 Z" fill="#f6f2ea"/>
    <path d="M-5 2 L-10 11 L-5 9 Z M5 2 L10 11 L5 9 Z" fill="#e3b55b"/>
    <circle cx="0" cy="-5" r="2.6" fill="#1e3a66" stroke="#e3b55b" stroke-width="1.2"/>
  </g>
</svg>`;

function nameExpression(locale: Locale): ExpressionSpecification {
  return locale === "ru"
    ? ["coalesce", ["get", "name:ru"], ["get", "name"]]
    : ["coalesce", ["get", "name:en"], ["get", "name_en"], ["get", "name"]];
}

function buildStyle(locale: Locale, ours: string[]): StyleSpecification {
  const name = nameExpression(locale);
  return {
    version: 8,
    projection: { type: "globe" },
    sky: {
      "sky-color": "#0b1222",
      "horizon-color": "#355a8f",
      "fog-color": "#0b1222",
      "sky-horizon-blend": 0.7,
      "horizon-fog-blend": 0.6,
      "fog-ground-blend": 0.9,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 8, 0],
    },
    glyphs: GLYPHS,
    sources: {
      earth: {
        type: "raster",
        tiles: [BLUE_MARBLE],
        tileSize: 256,
        maxzoom: 8,
        attribution:
          '<a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noopener">NASA GIBS</a>',
      },
      omt: {
        type: "vector",
        url: VECTOR,
        attribution:
          '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
      trail: { type: "geojson", data: EMPTY },
      routes: { type: "geojson", data: EMPTY },
      path: { type: "geojson", data: EMPTY },
      head: { type: "geojson", data: EMPTY },
    },
    layers: [
      { id: "land", type: "background", paint: { "background-color": "#16263f" } },
      {
        id: "forest",
        type: "fill",
        source: "omt",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "wood"],
        paint: { "fill-color": "#1a2e48", "fill-opacity": 0.8 },
      },
      {
        id: "water",
        type: "fill",
        source: "omt",
        "source-layer": "water",
        paint: { "fill-color": "#0a1528" },
      },
      {
        id: "earth",
        type: "raster",
        source: "earth",
        paint: {
          "raster-opacity": ["interpolate", ["linear"], ["zoom"], 5.5, 1, 8, 0],
          "raster-fade-duration": 250,
        },
      },
      {
        id: "rivers",
        type: "line",
        source: "omt",
        "source-layer": "waterway",
        filter: ["==", ["get", "class"], "river"],
        paint: {
          "line-color": "#4f86c6",
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 9, 1.6, 13, 3.5],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 8, 0.95],
        },
      },
      {
        id: "roads",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        minzoom: 9,
        filter: ["match", ["get", "class"], ["primary", "secondary", "tertiary", "minor", "track"], true, false],
        paint: { "line-color": "#2f4566", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 14, 2] },
      },
      {
        id: "borders",
        type: "line",
        source: "omt",
        "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": "#ffffff", "line-opacity": 0.28, "line-width": 1, "line-dasharray": [3, 2] },
      },
      {
        id: "river-names",
        type: "symbol",
        source: "omt",
        "source-layer": "waterway",
        minzoom: 8,
        filter: ["==", ["get", "class"], "river"],
        layout: {
          "symbol-placement": "line",
          "text-field": name,
          "text-font": ["Noto Sans Italic"],
          "text-size": 13,
          "text-letter-spacing": 0.15,
        },
        paint: { "text-color": "#9cc3f0", "text-halo-color": "#0b1222", "text-halo-width": 1.4 },
      },
      {
        id: "towns",
        type: "symbol",
        source: "omt",
        "source-layer": "place",
        minzoom: 3,
        // Towns the family lived in carry a marker of their own; the map's
        // label would sit under it twice.
        filter: [
          "all",
          ["match", ["get", "class"], ["city", "town"], true, false],
          ["!", ["in", name, ["literal", ours]]],
        ],
        layout: {
          "text-field": name,
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3, 10, 10, 13],
          "text-max-width": 8,
        },
        paint: {
          "text-color": "#d5deec",
          "text-opacity": 0.75,
          "text-halo-color": "#0b1222",
          "text-halo-width": 1.4,
        },
      },
      {
        id: "path-line",
        type: "line",
        source: "path",
        paint: {
          "line-color": "#d6e2f4",
          "line-width": 2.2,
          "line-dasharray": [2, 1.4],
          "line-opacity": ["case", ["==", ["get", "state"], "current"], 0.95, 0.35],
        },
      },
      {
        id: "path-label",
        type: "symbol",
        source: "path",
        filter: ["==", ["get", "state"], "current"],
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "label"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-offset": [0, -1],
        },
        paint: { "text-color": "#ffffff", "text-halo-color": "#0b1222", "text-halo-width": 1.6 },
      },
      // Routes from earlier steps, set once per step…
      ...routeLayers("trail"),
      // …and the ones being drawn now, redrawn every frame. Apart, so a frame
      // resends one short line to the map's worker rather than all of them.
      ...routeLayers("routes"),
      // The bright point at the front of a line while it is being drawn.
      {
        id: "head-glow",
        type: "circle",
        source: "head",
        paint: { "circle-radius": 14, "circle-color": COLORS.move, "circle-blur": 1, "circle-opacity": 0.75 },
      },
      {
        id: "head-dot",
        type: "circle",
        source: "head",
        paint: { "circle-radius": 3.5, "circle-color": "#fff8e6" },
      },
    ],
  };
}

/** The glow, the solid line and the dashed one (a marriage, not a move)
 *  for a source of routes. */
function routeLayers(source: string): StyleSpecification["layers"] {
  return [
    {
      id: `${source}-glow`,
      type: "line",
      source,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["match", ["get", "kind"], "link", COLORS.link, "rocket", COLORS.rocket, COLORS.move],
        "line-width": ["case", ["==", ["get", "state"], "current"], 12, 6],
        "line-blur": 8,
        "line-opacity": ["case", ["==", ["get", "state"], "current"], 0.45, 0.18],
      },
    },
    {
      id: `${source}-solid`,
      type: "line",
      source,
      filter: ["!=", ["get", "kind"], "link"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["match", ["get", "kind"], "rocket", COLORS.rocket, COLORS.move],
        "line-width": ["case", ["==", ["get", "state"], "current"], 3, 1.8],
        "line-opacity": ["case", ["==", ["get", "state"], "current"], 1, 0.6],
      },
    },
    {
      id: `${source}-dashed`,
      type: "line",
      source,
      filter: ["==", ["get", "kind"], "link"],
      layout: { "line-cap": "round" },
      paint: {
        "line-color": COLORS.link,
        "line-width": ["case", ["==", ["get", "state"], "current"], 3, 1.8],
        "line-dasharray": [1, 1.6],
        "line-opacity": ["case", ["==", ["get", "state"], "current"], 1, 0.6],
      },
    },
  ];
}

/** A gentle curve between two nearby points: a quadratic Bézier whose
 *  control point stands off the straight line, to the left of travel. */
function bend(a: LngLat, b: LngLat, steps = 72): LngLat[] {
  const mid: LngLat = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const control: LngLat = [mid[0] - dy * 0.28, mid[1] + dx * 0.28];
  const out: LngLat[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * control[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * control[1] + t * t * b[1],
    ]);
  }
  return out;
}

/** The shortest way around the planet — what a flight across the ocean
 *  follows, arching up towards Greenland on the way. */
function greatCircle(a: LngLat, b: LngLat, steps = 160): LngLat[] {
  const rad = Math.PI / 180;
  const toVec = ([lng, lat]: LngLat) => [
    Math.cos(lat * rad) * Math.cos(lng * rad),
    Math.cos(lat * rad) * Math.sin(lng * rad),
    Math.sin(lat * rad),
  ];
  const p = toVec(a);
  const q = toVec(b);
  const omega = Math.acos(Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
  const out: LngLat[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const s1 = Math.sin((1 - t) * omega) / Math.sin(omega);
    const s2 = Math.sin(t * omega) / Math.sin(omega);
    const x = s1 * p[0] + s2 * q[0];
    const y = s1 * p[1] + s2 * q[1];
    const z = s1 * p[2] + s2 * q[2];
    out.push([Math.atan2(y, x) / rad, Math.atan2(z, Math.hypot(x, y)) / rad]);
  }
  return out;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Softer at both ends than the cubic: a rocket that crawls for the first
 *  half-second reads as a stall, not as a launch. */
const easeFlight = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** The point a fraction `t` of the way along a line — between its vertices,
 *  not snapped to one, so slow movement stays smooth instead of stepping. */
function along(line: LngLat[], t: number): LngLat {
  const at = Math.min(1, Math.max(0, t)) * (line.length - 1);
  const i = Math.min(line.length - 2, Math.floor(at));
  const f = at - i;
  const a = line[i];
  const b = line[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}


interface Journey {
  show: (index: number) => void;
  destroy: () => void;
}

/**
 * Everything that happens on the map, outside React: the markers, the
 * routes, the camera, the rocket. The component below makes one of these
 * when the map has loaded and tells it which step to show.
 */
function createJourney(
  map: MapLibreMap,
  tree: FamilyTree,
  locale: Locale,
  onUserMove: () => void,
  onPick: (index: number) => void,
): Journey {
  const places = new Map(tree.places.map((p) => [p.id, p]));
  const last = tree.journey.length - 1;
  let current = -2;
  let frame = 0;
  let spin = 0;
  let timers: number[] = [];
  let rocket: Marker | null = null;
  // While the rocket flies the camera rides along — until someone grabs it.
  let follow = false;

  // The geometry of every route, worked out once.
  const geometry = new Map<string, LngLat[]>();
  for (const step of tree.journey) {
    for (const route of step.routes ?? []) {
      const a = places.get(route.from);
      const b = places.get(route.to);
      if (!a || !b) continue;
      geometry.set(
        `${route.from}>${route.to}`,
        route.kind === "rocket" ? greatCircle([a.lng, a.lat], [b.lng, b.lat]) : bend([a.lng, a.lat], [b.lng, b.lat]),
      );
    }
  }

  const markers = new Map<string, HTMLElement>();
  const pins: Marker[] = [];
  for (const place of tree.places) {
    // MapLibre positions the outer element with a transform of its own, so
    // everything that moves or fades lives on the inner one.
    const outer = document.createElement("div");
    const element = document.createElement("div");
    outer.append(element);
    element.className = "fam-marker";
    element.dataset.state = "hidden";
    if (place.memorial) element.dataset.memorial = "";
    const dot = document.createElement("span");
    dot.className = "fam-marker-dot";
    const label = document.createElement("span");
    label.className = "fam-marker-label";
    label.textContent = place.name[locale];
    if (place.alias) {
      const small = document.createElement("small");
      small.textContent = place.alias[locale];
      label.append(small);
    }
    element.append(dot, label);
    // A lit place is a way back into the story: the latest step up to now
    // that has it, or else the first one that does.
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      const having = tree.journey
        .map((step, index) => (step.places.includes(place.id) ? index : -1))
        .filter((index) => index >= 0);
      const back = having.filter((index) => index <= current);
      const pick = back.length ? back[back.length - 1] : having[0];
      if (pick !== undefined && pick !== current) onPick(pick);
    });
    pins.push(
      new maplibregl.Marker({ element: outer, anchor: "left", offset: [-6, 0] })
        .setLngLat([place.lng, place.lat])
        .addTo(map),
    );
    markers.set(place.id, element);
  }

  const later = (fn: () => void, ms: number) => {
    timers.push(window.setTimeout(fn, ms));
  };

  const stopAll = () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(spin);
    for (const id of timers) window.clearTimeout(id);
    timers = [];
    rocket?.remove();
    rocket = null;
    follow = false;
  };

  const grabbed = (event: { originalEvent?: unknown }) => {
    if (!event.originalEvent) return;
    cancelAnimationFrame(spin);
    follow = false;
    onUserMove();
  };
  map.on("dragstart", grabbed);
  map.on("zoomstart", grabbed);
  map.on("rotatestart", grabbed);
  map.on("pitchstart", grabbed);

  /** A ring of light that spreads from a point and fades. */
  const burst = (point: LngLat) => {
    const element = document.createElement("div");
    const ring = document.createElement("div");
    ring.className = "fam-burst";
    element.append(ring);
    const marker = new maplibregl.Marker({ element }).setLngLat(point).addTo(map);
    later(() => marker.remove(), 1500);
  };

  /** The rocket arrives: a ring of light, and the camera comes down. */
  const land = (point: LngLat) => {
    rocket?.remove();
    rocket = null;
    follow = false;
    burst(point);
    // Straight on from the flight's last frame — a pause here reads as a
    // stutter. easeTo rather than flyTo: no zoom out-and-in on the way.
    if (current === last) {
      map.easeTo({
        center: point,
        zoom: 5.2,
        pitch: 30,
        duration: 2600,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        essential: true,
      });
    }
  };

  const show = (index: number) => {
    if (index === current) return;
    current = index;
    stopAll();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const routes = map.getSource("routes") as GeoJSONSource;
    const trail = map.getSource("trail") as GeoJSONSource;
    const path = map.getSource("path") as GeoJSONSource;
    const head = map.getSource("head") as GeoJSONSource;
    head.setData(EMPTY);

    // Before the story: the planet, turning slowly with Russia in view.
    if (index < 0) {
      for (const element of markers.values()) element.dataset.state = "hidden";
      routes.setData(EMPTY);
      trail.setData(EMPTY);
      path.setData(EMPTY);
      map.jumpTo({ center: [map.getCenter().lng, 50], zoom: 1.35, pitch: 0, bearing: 0 });
      if (!still) {
        const turn = () => {
          const center = map.getCenter();
          map.jumpTo({ center: [center.lng + 0.06, center.lat] });
          spin = requestAnimationFrame(turn);
        };
        spin = requestAnimationFrame(turn);
      }
      return;
    }

    const step = tree.journey[index];
    if (!step) return;

    // Markers: this step's places glow, earlier ones stay as quiet dots.
    const seen = new Set<string>();
    tree.journey.slice(0, index).forEach((one) => one.places.forEach((id) => seen.add(id)));
    for (const [id, element] of markers) {
      element.dataset.state = step.places.includes(id) ? "current" : seen.has(id) ? "past" : "hidden";
    }

    // The railway, or any other drawn line, stays faintly after its step.
    const lines: GeoJSON.Feature[] = [];
    tree.journey.slice(0, index + 1).forEach((one, at) => {
      if (!one.path) return;
      lines.push({
        type: "Feature",
        properties: { state: at === index ? "current" : "past", label: one.path.label[locale] },
        geometry: { type: "LineString", coordinates: one.path.points },
      });
    });
    path.setData({ type: "FeatureCollection", features: lines });

    // Routes: everything before this step drawn in full and dimmed.
    const past: GeoJSON.Feature[] = [];
    tree.journey.slice(0, index).forEach((one) =>
      (one.routes ?? []).forEach((route) => {
        const line = geometry.get(`${route.from}>${route.to}`);
        if (line)
          past.push({
            type: "Feature",
            properties: { kind: route.kind, state: "past" },
            geometry: { type: "LineString", coordinates: line },
          });
      }),
    );
    const drawing = (step.routes ?? []).map((route) => ({
      route,
      line: geometry.get(`${route.from}>${route.to}`) ?? [],
    }));
    trail.setData({ type: "FeatureCollection", features: past });
    const draw = (t: number) => {
      const features: GeoJSON.Feature[] = [];
      const heads: GeoJSON.Feature[] = [];
      for (const { route, line } of drawing) {
        if (line.length < 2) continue;
        const end = Math.max(1, Math.floor(t * (line.length - 1)) + 1);
        const tip = along(line, t);
        features.push({
          type: "Feature",
          properties: { kind: route.kind, state: "current" },
          geometry: { type: "LineString", coordinates: [...line.slice(0, end), tip] },
        });
        if (route.kind !== "rocket" && t > 0 && t < 1) {
          heads.push({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: tip } });
        }
      }
      routes.setData({ type: "FeatureCollection", features });
      head.setData({ type: "FeatureCollection", features: heads });
    };
    draw(still ? 1 : 0);

    const { camera } = step;
    // Names are written to the right of their dot; on a phone the frame is
    // narrow enough to cut them, so the point of interest moves left.
    const narrow = map.getContainer().clientWidth < 640;
    const target = {
      center: [camera.lng, camera.lat] as LngLat,
      zoom: narrow ? camera.zoom - 0.4 : camera.zoom,
      pitch: camera.pitch ?? 0,
      bearing: camera.bearing ?? 0,
      padding: { top: 0, bottom: 0, left: 0, right: narrow ? 140 : 0 },
    };
    if (still) {
      map.jumpTo(target);
      return;
    }
    const flight = drawing.find(({ route, line }) => route.kind === "rocket" && line.length > 1);
    const high = narrow ? 2.8 : 3.4;

    // The rocket's step: down to the launch pad first; then the camera rides
    // along with it across the ocean.
    if (flight) {
      map.flyTo({
        center: flight.line[0],
        zoom: high,
        pitch: 20,
        bearing: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration: 1600,
        essential: true,
      });
    } else {
      map.flyTo({ ...target, duration: 2300, curve: 1.4, essential: true });
    }

    if (drawing.length === 0) return;
    const length = flight ? 5200 : 1500;

    later(
      () => {
        if (flight) {
          const element = document.createElement("div");
          element.innerHTML = ROCKET_SVG;
          rocket = new maplibregl.Marker({ element, rotationAlignment: "viewport" })
            .setLngLat(flight.line[0])
            .addTo(map);
          burst(flight.line[0]);
          follow = true;
        }
        const start = performance.now();
        const tick = (now: number) => {
          // A frame's timestamp can fall just before `start`; a negative t
          // would ask for the point before the first one.
          const t = Math.min(1, Math.max(0, (now - start) / length));
          const eased = flight ? easeFlight(t) : ease(t);
          draw(eased);
          if (flight && rocket) {
            const line = flight.line;
            const here = along(line, eased);
            rocket.setLngLat(here);
            // Up to see the ocean whole halfway over, down again at the end.
            if (follow) map.jumpTo({ center: here, zoom: high - 1.5 * Math.sin(Math.PI * eased) });
            // Pointing where it goes: the screen direction to a point a
            // little further along.
            const p1 = map.project(here);
            const p2 = map.project(along(line, Math.min(1, eased + 0.01)));
            if (Math.hypot(p2.x - p1.x, p2.y - p1.y) > 0.5) {
              rocket.setRotation((Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI + 90);
            }
          }
          if (t < 1) frame = requestAnimationFrame(tick);
          else if (flight) land(flight.line[flight.line.length - 1]);
        };
        frame = requestAnimationFrame(tick);
      },
      flight ? 1700 : 800,
    );
  };

  return {
    show,
    destroy: () => {
      stopAll();
      for (const pin of pins) pin.remove();
    },
  };
}

export default function FamilyMap({
  tree,
  locale,
  stage,
  onReady,
  onFail,
  onUserMove,
  onPick,
}: {
  tree: FamilyTree;
  locale: Locale;
  /** -1 is the planet turning slowly before the story starts. */
  stage: number;
  onReady: () => void;
  onFail: () => void;
  /** The visitor grabbed the globe — the parent stops the autoplay. */
  onUserMove: () => void;
  /** A place on the globe was clicked — the parent moves to that step. */
  onPick: (index: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const journey = useRef<Journey | null>(null);

  // Read from inside the map's own callbacks, which outlive any one render.
  const failed = useEffectEvent(() => onFail());
  const moved = useEffectEvent(() => onUserMove());
  const picked = useEffectEvent((index: number) => onPick(index));
  const loaded = useEffectEvent((made: Journey) => {
    journey.current = made;
    onReady();
    made.show(stage);
  });

  useEffect(() => {
    const container = box.current;
    if (!container) return;

    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container,
        style: buildStyle(
          locale,
          tree.places.map((place) => place.name[locale]),
        ),
        center: [tree.journey[0].camera.lng, 50],
        zoom: 1.35,
        attributionControl: { compact: true },
        // Without this the page under the map stops scrolling the moment
        // the wheel or a finger passes over the globe.
        cooperativeGestures: true,
        maxPitch: 65,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        locale:
          locale === "ru"
            ? {
                "CooperativeGesturesHandler.WindowsHelpText": "Ctrl + колесо мыши — приблизить карту",
                "CooperativeGesturesHandler.MacHelpText": "⌘ + колесо мыши — приблизить карту",
                "CooperativeGesturesHandler.MobileHelpText": "Двумя пальцами — двигать карту",
                "NavigationControl.ZoomIn": "Приблизить",
                "NavigationControl.ZoomOut": "Отдалить",
              }
            : {},
      });
    } catch {
      failed();
      return;
    }
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    let made: Journey | null = null;
    map.on("load", () => {
      // A compact attribution starts unfolded; on a phone two lines of it
      // sit under the player. Folded, it is the usual "i".
      container.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      made = createJourney(
        map,
        tree,
        locale,
        () => moved(),
        (index) => picked(index),
      );
      loaded(made);
    });
    map.on("webglcontextlost", () => failed());

    return () => {
      made?.destroy();
      journey.current = null;
      map.remove();
    };
  }, [tree, locale]);

  useEffect(() => {
    journey.current?.show(stage);
  }, [stage]);

  // A size of its own rather than `absolute inset-0`: MapLibre's stylesheet
  // makes the container `position: relative`, and without a height it would
  // collapse to nothing.
  return <div ref={box} className="fam-map size-full" />;
}
