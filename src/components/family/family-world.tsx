"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Locale } from "@/i18n/config";
import type { FamilyTree } from "@/lib/family/types";
import { familyCopy as c } from "./family-copy";

const FamilyMap = dynamic(() => import("./family-map"), { ssr: false });

/** How long each step stays on screen while playing. */
const STEP_MS = 5000;
const ROCKET_MS = 10000;

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

  const player = (
    <Player
      locale={locale}
      stage={stage}
      last={last}
      playing={playing}
      disabled={failed}
      onToggle={toggle}
      onStep={(index) => choose(Math.min(last, Math.max(0, index)))}
    />
  );

  return (
    <section id="world" className="fam scroll-mt-20 bg-[color:var(--night)] pb-16 pt-14 text-white sm:pb-24 sm:pt-20">
      <div className="container-narrow">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
          {c.worldTag[locale]}
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight sm:text-5xl">{c.worldTitle[locale]}</h2>
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
                onPick={choose}
              />
            </div>
          )}

          {/* Before the story starts — reduced motion, or a visitor who
              scrolled past — one clear way in. */}
          {ready && !failed && stage < 0 && !playing && (
            <div className="absolute inset-0 grid place-items-center bg-[#0b1222]/25">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex items-center gap-3 rounded-full bg-[color:var(--gold)] py-3 pl-3 pr-6 text-base font-semibold text-[color:var(--gold-foreground)] shadow-[var(--shadow-elegant)] transition hover:scale-105 motion-safe:animate-[fam-breathe_2.4s_ease-in-out_infinite]"
              >
                <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-[color:var(--gold-foreground)]/10 pl-0.5 text-lg">
                  ▶
                </span>
                {c.watchJourney[locale]}
              </button>
            </div>
          )}

          {/* On wider screens the words sit on the globe. */}
          <div className="absolute bottom-4 left-4 hidden w-[24rem] max-w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-[#0b1222]/80 p-5 backdrop-blur-md md:block">
            {caption}
            <div className="mt-4 border-t border-white/10 pt-4">{player}</div>
          </div>

          {/* On a phone the controls float on the globe, under the thumb —
              once the story has started; before that the big button leads. */}
          {(stage >= 0 || playing) && (
            <div className="absolute inset-x-0 bottom-10 flex justify-center md:hidden">
              <div className="rounded-full border border-white/10 bg-[#0b1222]/85 p-1.5 backdrop-blur-md">{player}</div>
            </div>
          )}
        </div>

        {/* On a phone they go under it, so the globe keeps the whole frame. */}
        <div className="mt-5 min-h-[9rem] md:hidden">{caption}</div>

        <div className="mt-6">
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
        </div>

        <p className="mt-5 text-xs leading-relaxed text-white/40">
          {c.placeHint[locale]} {c.mapHint[locale]} {c.approximate[locale]}
        </p>
      </div>
    </section>
  );
}

/**
 * Back, play/pause, forward and where we are. The ring round the play button
 * fills while the step on screen lasts, so the visitor sees the story is
 * moving on by itself and when.
 */
function Player({
  locale,
  stage,
  last,
  playing,
  disabled,
  onToggle,
  onStep,
}: {
  locale: Locale;
  stage: number;
  last: number;
  playing: boolean;
  disabled: boolean;
  onToggle: () => void;
  onStep: (index: number) => void;
}) {
  const done = stage >= last;
  const label = playing ? c.pause[locale] : done ? c.replay[locale] : c.play[locale];
  const arrow =
    "grid size-10 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onStep(stage - 1)} disabled={disabled || stage <= 0} aria-label={c.previous[locale]} className={arrow}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={label}
        title={label}
        className="relative grid size-12 shrink-0 place-items-center rounded-full bg-[color:var(--gold)] text-[color:var(--gold-foreground)] transition hover:scale-105 active:scale-95 disabled:opacity-40"
      >
        {playing && stage >= 0 && (
          <svg key={stage} viewBox="0 0 52 52" className="pointer-events-none absolute -inset-1 size-[calc(100%+0.5rem)] -rotate-90" aria-hidden="true">
            <circle
              cx="26"
              cy="26"
              r="24.5"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.85"
              strokeWidth="2"
              pathLength={100}
              strokeDasharray="100"
              style={{ animation: `fam-ring ${done ? ROCKET_MS : STEP_MS}ms linear both` }}
            />
          </svg>
        )}
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          {playing ? (
            <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
          ) : done ? (
            <path d="M12 5a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 12 7v3L7.5 6 12 2z" />
          ) : (
            <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5z" />
          )}
        </svg>
      </button>
      <button type="button" onClick={() => onStep(stage + 1)} disabled={disabled || done} aria-label={c.next[locale]} className={arrow}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
      <span className="ml-1 whitespace-nowrap pr-2 font-mono text-xs tabular-nums text-white/55">
        {Math.max(0, stage + 1)}
        <span className="text-white/30"> / {last + 1}</span>
      </span>
    </div>
  );
}
