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
      routes: { type: "geojson", data: EMPTY },
      path: { type: "geojson", data: EMPTY },
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
      {
        id: "routes-glow",
        type: "line",
        source: "routes",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "kind"], "link", COLORS.link, "rocket", COLORS.rocket, COLORS.move],
          "line-width": ["case", ["==", ["get", "state"], "current"], 12, 6],
          "line-blur": 8,
          "line-opacity": ["case", ["==", ["get", "state"], "current"], 0.45, 0.18],
        },
      },
      {
        id: "routes-solid",
        type: "line",
        source: "routes",
        filter: ["!=", ["get", "kind"], "link"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "kind"], "rocket", COLORS.rocket, COLORS.move],
          "line-width": ["case", ["==", ["get", "state"], "current"], 3, 1.8],
          "line-opacity": ["case", ["==", ["get", "state"], "current"], 1, 0.6],
        },
      },
      {
        id: "routes-dashed",
        type: "line",
        source: "routes",
        filter: ["==", ["get", "kind"], "link"],
        layout: { "line-cap": "round" },
        paint: {
          "line-color": COLORS.link,
          "line-width": ["case", ["==", ["get", "state"], "current"], 3, 1.8],
          "line-dasharray": [1, 1.6],
          "line-opacity": ["case", ["==", ["get", "state"], "current"], 1, 0.6],
        },
      },
    ],
  };
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
): Journey {
  const places = new Map(tree.places.map((p) => [p.id, p]));
  const last = tree.journey.length - 1;
  let current = -2;
  let frame = 0;
  let spin = 0;
  let timers: number[] = [];
  let rocket: Marker | null = null;

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
  };

  const grabbed = (event: { originalEvent?: unknown }) => {
    if (!event.originalEvent) return;
    cancelAnimationFrame(spin);
    onUserMove();
  };
  map.on("dragstart", grabbed);
  map.on("zoomstart", grabbed);
  map.on("rotatestart", grabbed);
  map.on("pitchstart", grabbed);

  /** The rocket arrives: a ring of light, and the camera comes down. */
  const land = (point: LngLat) => {
    rocket?.remove();
    rocket = null;
    const burst = document.createElement("div");
    const ring = document.createElement("div");
    ring.className = "fam-burst";
    burst.append(ring);
    const marker = new maplibregl.Marker({ element: burst }).setLngLat(point).addTo(map);
    later(() => marker.remove(), 1500);
    later(() => {
      if (current === last) {
        map.flyTo({ center: point, zoom: 5.2, pitch: 30, duration: 3400, essential: true });
      }
    }, 600);
  };

  const show = (index: number) => {
    if (index === current) return;
    current = index;
    stopAll();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const routes = map.getSource("routes") as GeoJSONSource;
    const path = map.getSource("path") as GeoJSONSource;

    // Before the story: the planet, turning slowly with Russia in view.
    if (index < 0) {
      for (const element of markers.values()) element.dataset.state = "hidden";
      routes.setData(EMPTY);
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
    const draw = (t: number) => {
      const features: GeoJSON.Feature[] = [...past];
      for (const { route, line } of drawing) {
        features.push({
          type: "Feature",
          properties: { kind: route.kind, state: "current" },
          geometry: { type: "LineString", coordinates: line.slice(0, Math.max(2, Math.ceil(line.length * t))) },
        });
      }
      routes.setData({ type: "FeatureCollection", features });
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
    map.flyTo({ ...target, duration: 3200, curve: 1.5, essential: true });

    if (drawing.length === 0) return;
    const flight = drawing.find(({ route }) => route.kind === "rocket");
    const length = flight ? 5600 : 1900;

    later(
      () => {
        if (flight) {
          const element = document.createElement("div");
          element.innerHTML = ROCKET_SVG;
          rocket = new maplibregl.Marker({ element, rotationAlignment: "viewport" })
            .setLngLat(flight.line[0])
            .addTo(map);
        }
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / length);
          const eased = ease(t);
          draw(eased);
          if (flight && rocket) {
            const line = flight.line;
            const at = Math.min(line.length - 1, Math.floor(eased * (line.length - 1)));
            const ahead = Math.min(line.length - 1, at + 2);
            rocket.setLngLat(line[at]);
            const p1 = map.project(line[Math.max(0, ahead - 3)]);
            const p2 = map.project(line[ahead]);
            if (p1.x !== p2.x || p1.y !== p2.y) {
              rocket.setRotation((Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI + 90);
            }
          }
          if (t < 1) frame = requestAnimationFrame(tick);
          else if (flight) land(flight.line[flight.line.length - 1]);
        };
        frame = requestAnimationFrame(tick);
      },
      flight ? 2600 : 1200,
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
}: {
  tree: FamilyTree;
  locale: Locale;
  /** -1 is the planet turning slowly before the story starts. */
  stage: number;
  onReady: () => void;
  onFail: () => void;
  /** The visitor grabbed the globe — the parent stops the autoplay. */
  onUserMove: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const journey = useRef<Journey | null>(null);

  // Read from inside the map's own callbacks, which outlive any one render.
  const failed = useEffectEvent(() => onFail());
  const moved = useEffectEvent(() => onUserMove());
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
      made = createJourney(map, tree, locale, () => moved());
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
