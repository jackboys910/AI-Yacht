"use client";

import { useEffect, useRef } from "react";

/**
 * The Earth as a sphere, drawn on a canvas from one flat photograph.
 *
 * Every pixel of the disc is traced back to the latitude and longitude it
 * shows (an orthographic projection, seen from above `lat`), and coloured
 * from NASA's Blue Marble at that point. Light comes from the upper left,
 * night falls to the lower right, and the rim glows with the atmosphere — so
 * the continents curve away over the horizon instead of sliding across a
 * flat circle.
 *
 * No WebGL and no 3D library: the geometry is worked out once per size, and
 * a frame is then one lookup per pixel, which a phone does in a few
 * milliseconds. It is drawn only when something changed and only while on
 * screen; with reduced motion asked for it does not turn at all.
 */

const TEXTURE = "/story/earth-2k.jpg";
/** Light from the upper left and in front, in view space. */
const LIGHT = normalize([-0.55, 0.5, 0.67]);
const RIM: [number, number, number] = [110, 170, 255];

function normalize([x, y, z]: number[]): [number, number, number] {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

interface Texture {
  pixels: Uint32Array;
  width: number;
  height: number;
}

let shared: Promise<Texture> | null = null;

/** One decode of the photograph for every globe on the page. */
function loadTexture(): Promise<Texture> {
  shared ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return reject(new Error("no 2d context"));
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      resolve({ pixels: new Uint32Array(data.buffer), width: canvas.width, height: canvas.height });
    };
    image.onerror = () => {
      shared = null;
      reject(new Error("texture failed"));
    };
    image.src = TEXTURE;
  });
  return shared;
}

/** Everything about the disc that does not change as it turns. */
interface Disc {
  size: number;
  index: Int32Array;
  row: Int32Array;
  lon: Float32Array;
  light: Float32Array;
  glow: Float32Array;
  alpha: Uint8Array;
}

function buildDisc(size: number, viewLat: number, texture: Texture): Disc {
  const tilt = (viewLat * Math.PI) / 180;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const edge = 1 + 1.5 / size;
  const index: number[] = [];
  const row: number[] = [];
  const lon: number[] = [];
  const light: number[] = [];
  const glow: number[] = [];
  const alpha: number[] = [];
  for (let py = 0; py < size; py += 1) {
    const y = 1 - ((py + 0.5) / size) * 2;
    for (let px = 0; px < size; px += 1) {
      const x = ((px + 0.5) / size) * 2 - 1;
      const r2 = x * x + y * y;
      if (r2 > edge * edge) continue;
      const r = Math.sqrt(r2);
      const z = Math.sqrt(Math.max(0, 1 - r2));
      // Turn the view so the centre of the disc sits at `viewLat`.
      const wy = y * cos + z * sin;
      const wz = z * cos - y * sin;
      const lat = Math.asin(Math.max(-1, Math.min(1, wy)));
      const lng = Math.atan2(x, wz);
      const v = Math.min(texture.height - 1, Math.max(0, Math.floor((0.5 - lat / Math.PI) * texture.height)));
      // Daylight with a soft terminator, a touch of glare where the light
      // reflects straight back, and a little left over for the night side.
      const n = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2];
      const day = Math.max(0, Math.min(1, (n + 0.15) / 0.9));
      const glare = Math.pow(Math.max(0, 2 * n * z - LIGHT[2]), 24) * 70;
      index.push(py * size + px);
      row.push(v * texture.width);
      lon.push((lng / (2 * Math.PI)) * texture.width);
      light.push(0.08 + 1.12 * day * day * (3 - 2 * day));
      glow.push(Math.pow(1 - z, 2.2) * (0.35 + 0.65 * day) + glare / 255);
      alpha.push(Math.round(Math.max(0, Math.min(1, (1 - r) * (size / 2) + 0.5)) * 255));
    }
  }
  return {
    size,
    index: Int32Array.from(index),
    row: Int32Array.from(row),
    lon: Float32Array.from(lon),
    light: Float32Array.from(light),
    glow: Float32Array.from(glow),
    alpha: Uint8Array.from(alpha),
  };
}

function paint(context: CanvasRenderingContext2D, image: ImageData, disc: Disc, texture: Texture, centerLon: number) {
  const out = new Uint32Array(image.data.buffer);
  out.fill(0);
  const { pixels, width } = texture;
  const shift = ((centerLon + 180) / 360) * width + width * 8;
  const { index, row, lon, light, glow, alpha } = disc;
  for (let i = 0; i < index.length; i += 1) {
    // `shift` carries eight turns of the texture, so the sum is never negative.
    const color = pixels[row[i] + (((lon[i] + shift) | 0) % width)];
    const l = light[i];
    const g = glow[i];
    const r = Math.min(255, (color & 255) * l + RIM[0] * g);
    const gr = Math.min(255, ((color >> 8) & 255) * l + RIM[1] * g);
    const b = Math.min(255, ((color >> 16) & 255) * l + RIM[2] * g);
    out[index[i]] = (alpha[i] << 24) | (b << 16) | (gr << 8) | r;
  }
  context.putImageData(image, 0, 0);
}

export function EarthGlobe({
  lon = 40,
  lat = 32,
  spin = 0,
  className = "",
}: {
  /** The meridian in the middle; a change turns the globe there. */
  lon?: number;
  /** The latitude the globe is seen from. */
  lat?: number;
  /** Degrees per second of slow rotation; 0 to stand still. */
  spin?: number;
  /** Sizes the globe: it fills a square box. */
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const wanted = useRef({ lon, spin });
  // Set by the drawing loop below: a globe standing still needs a nudge to
  // start turning towards a new meridian.
  const nudge = useRef<() => void>(() => {});

  useEffect(() => {
    wanted.current = { lon, spin };
    nudge.current();
  }, [lon, spin]);

  useEffect(() => {
    const element = canvas.current;
    const holder = box.current;
    const context = element?.getContext("2d");
    if (!element || !holder || !context) return;

    let texture: Texture | null = null;
    let disc: Disc | null = null;
    let image: ImageData | null = null;
    let frame = 0;
    let visible = false;
    let last = 0;
    let center = wanted.current.lon;
    let target = center;
    let drawn = Number.NaN;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      if (!texture) return;
      // Sharp on a retina screen, without tracing more pixels than the
      // photograph has to give.
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.max(32, Math.min(900, Math.round(holder.clientWidth * ratio)));
      if (disc?.size === size) return;
      element.width = size;
      element.height = size;
      disc = buildDisc(size, lat, texture);
      image = context.createImageData(size, size);
      drawn = Number.NaN;
    };

    const tick = (now: number) => {
      frame = 0;
      if (!texture || !disc || !image) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      const { lon: goal, spin: speed } = wanted.current;
      if (goal !== target) target = goal;
      if (speed && !still) {
        center += speed * dt;
        target = center;
      } else {
        // The short way round to a new meridian, slowing as it arrives.
        const delta = ((((target - center) % 360) + 540) % 360) - 180;
        center = still || Math.abs(delta) < 0.05 ? target : center + delta * Math.min(1, dt * 3);
      }
      if (center !== drawn) {
        paint(context, image, disc, texture, center);
        drawn = center;
        element.dataset.ready = "";
      }
      const moving = (speed && !still) || center !== target;
      if (visible && moving) frame = requestAnimationFrame(tick);
      else last = 0;
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const sizes = new ResizeObserver(() => {
      resize();
      wake();
    });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    nudge.current = () => {
      if (visible) wake();
    };

    let cancelled = false;
    loadTexture()
      .then((loaded) => {
        if (cancelled) return;
        texture = loaded;
        resize();
        wake();
      })
      .catch(() => {});
    sizes.observe(holder);
    seen.observe(holder);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      nudge.current = () => {};
      sizes.disconnect();
      seen.disconnect();
    };
  }, [lat]);

  return (
    <div ref={box} className={`relative aspect-square ${className}`}>
      {/* The atmosphere: a glow that starts at the edge of the disc and
          thins out into space. The box is 116% of the disc, so the edge
          sits at 86% of the gradient's radius. */}
      <div
        aria-hidden="true"
        className="absolute -inset-[8%] rounded-full bg-[radial-gradient(circle_closest-side,transparent_84%,rgb(130_185_255/0.55)_86.2%,rgb(80_140_255/0.22)_90%,rgb(60_110_255/0.07)_95%,transparent_100%)]"
      />
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="relative size-full rounded-full bg-[#081326] opacity-0 transition-opacity duration-700 data-[ready]:opacity-100"
      />
    </div>
  );
}
