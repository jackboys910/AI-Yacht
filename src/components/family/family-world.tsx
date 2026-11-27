"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Locale } from "@/i18n/config";
import type { FamilyTree } from "@/lib/family/types";
import { familyCopy as c } from "./family-copy";

const FamilyMap = dynamic(() => import("./family-map"), { ssr: false });

/** How long each step stays on screen while playing. */
const STEP_MS = 6500;
const ROCKET_MS = 12500;

/**
 * "The family's world": the globe and the timeline that drives it.
 *
 * The story plays by itself the first time the section comes into view —
 * a visitor who only scrolls still sees the family travel — and stops the
 * moment anyone takes hold of it: a step chosen, the globe dragged. The
 * steps are also plain buttons under the map, so the journey can be read
 * without the globe at all, which is what happens where WebGL is missing.
 */
export function FamilyWorld({ tree, locale }: { tree: FamilyTree; locale: Locale }) {
  const frame = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [stage, setStage] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const started = useRef(false);
  const loaded = useRef(false);
  const seen = useRef(false);
  const last = tree.journey.length - 1;

  /** The first time the globe is both ready and on screen, the story plays. */
  const begin = () => {
    if (started.current || !loaded.current || !seen.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStage(0);
    setPlaying(true);
  };

  // Load the map a screen or so before it is reached; start the story when
  // most of it is on screen; pause it when it scrolls away.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const early = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          early.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    const watch = new IntersectionObserver(
      ([entry]) => {
        seen.current = entry.intersectionRatio >= 0.45;
        if (seen.current) begin();
        else setPlaying(false);
      },
      { threshold: [0, 0.45, 1] },
    );
    early.observe(element);
    watch.observe(element);
    return () => {
      early.disconnect();
      watch.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (stage >= last) {
      const done = window.setTimeout(() => setPlaying(false), ROCKET_MS);
      return () => window.clearTimeout(done);
    }
    const next = window.setTimeout(
      () => setStage((one) => Math.min(last, one + 1)),
      stage < 0 ? 400 : STEP_MS,
    );
    return () => window.clearTimeout(next);
  }, [playing, stage, last]);

  // Keep the current step's button in view inside the strip — scrolling the
  // strip only, never the page.
  useEffect(() => {
    const box = strip.current;
    const button = box?.querySelector<HTMLElement>(`[data-step="${stage}"]`);
    if (!box || !button) return;
    const left = button.offsetLeft - box.clientWidth / 2 + button.clientWidth / 2;
    box.scrollTo({ left, behavior: "smooth" });
  }, [stage]);

  const choose = (index: number) => {
    started.current = true;
    setPlaying(false);
    setStage(index);
  };

  const toggle = () => {
    started.current = true;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (stage >= last || stage < 0) setStage(0);
    setPlaying(true);
  };

  const step = stage >= 0 ? tree.journey[stage] : null;

  const caption = (
    <div key={stage} className="motion-safe:animate-[fam-rise_0.6s_ease-out_both]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
        {step ? step.year[locale] : c.worldTag[locale]}
      </p>
      <h3 className="mt-2 font-display text-2xl leading-tight text-white sm:text-[28px]">
        {step ? step.title[locale] : c.worldTitle[locale]}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{step ? step.text[locale] : c.worldLead[locale]}</p>
    </div>
  );

  return (
    <section id="world" className="fam scroll-mt-20 bg-[color:var(--night)] pb-16 pt-14 text-white sm:pb-24 sm:pt-20">
      <div className="container-narrow">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
              {c.worldTag[locale]}
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-5xl">{c.worldTitle[locale]}</h2>
          </div>
          <button
            type="button"
            onClick={toggle}
            disabled={failed}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-40"
          >
            <span aria-hidden="true">{playing ? "❚❚" : stage >= last ? "↺" : "▶"}</span>
            {playing ? c.pause[locale] : stage >= last ? c.replay[locale] : c.play[locale]}
          </button>
        </div>
        <p className="mt-4 max-w-2xl text-white/65">{c.worldLead[locale]}</p>

        <div
          ref={frame}
          className="fam-stars relative mt-8 h-[62svh] min-h-[420px] max-h-[780px] overflow-hidden rounded-3xl border border-white/10 shadow-[var(--shadow-elegant)] sm:h-[72svh]"
        >
          {/* What stands in while the globe loads — and stays where it cannot. */}
          {(!ready || failed) && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="fam-twinkle" />
              <div className="flex flex-col items-center gap-5 px-6 text-center">
                <div className="fam-globe fam-globe-spin [--d:200px] sm:[--d:280px]" />
                <p className="max-w-sm text-sm text-white/60">{failed ? c.mapFailed[locale] : c.mapLoading[locale]}</p>
              </div>
            </div>
          )}

          {near && !failed && (
            <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
              <FamilyMap
                tree={tree}
                locale={locale}
                stage={stage}
                onReady={() => {
                  loaded.current = true;
                  setReady(true);
                  begin();
                }}
                onFail={() => setFailed(true)}
                onUserMove={() => {
                  started.current = true;
                  setPlaying(false);
                }}
              />
            </div>
          )}

          {/* On wider screens the words sit on the globe. */}
          <div className="pointer-events-none absolute bottom-4 left-4 hidden max-w-sm rounded-2xl border border-white/10 bg-[#0b1222]/80 p-5 backdrop-blur-md md:block">
            {caption}
            {playing && step && (
              <div className="mt-4 h-0.5 overflow-hidden rounded-full bg-white/10">
                <div
                  key={`bar-${stage}`}
                  className="h-full origin-left bg-[color:var(--gold)]"
                  style={{ animation: `fam-progress ${stage >= last ? ROCKET_MS : STEP_MS}ms linear both` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* On a phone they go under it, so the globe keeps the whole frame. */}
        <div className="mt-5 min-h-[9rem] md:hidden">{caption}</div>

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => choose(Math.max(0, stage - 1))}
            disabled={stage <= 0}
            aria-label={c.previous[locale]}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 transition hover:border-white disabled:opacity-30"
          >
            ←
          </button>
          <div ref={strip} className="scrollbar-hide flex flex-1 gap-2 overflow-x-auto py-1">
            {tree.journey.map((one, index) => (
              <button
                key={one.id}
                type="button"
                data-step={index}
                onClick={() => choose(index)}
                aria-current={index === stage ? "step" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-left text-xs transition ${
                  index === stage
                    ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"
                    : index < stage
                      ? "border-[color:var(--gold)]/40 text-white/85 hover:border-[color:var(--gold)]"
                      : "border-white/15 text-white/60 hover:border-white/50"
                }`}
              >
                <span className="font-semibold">{one.year[locale]}</span>
                <span className="ml-2 opacity-80">{one.title[locale]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => choose(Math.min(last, stage + 1))}
            disabled={stage >= last}
            aria-label={c.next[locale]}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 transition hover:border-white disabled:opacity-30"
          >
            →
          </button>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-white/40">
          {c.mapHint[locale]} {c.approximate[locale]}
        </p>
      </div>
    </section>
  );
}
