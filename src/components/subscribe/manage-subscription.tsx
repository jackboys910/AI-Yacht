"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { emailConfig } from "@/lib/email/config";
import { manageCopy } from "./manage-copy";
import type { SubscribeOption } from "./subscribe";

/**
 * The page a letter's "Unsubscribe" link opens (Н-09, Н-10, §8.3).
 *
 * Everything it knows comes from the key in the address. The page itself is
 * printed at build time like every other page here — there is nothing
 * person-specific in the HTML — and the subscription is fetched in the
 * browser, which is also why the key never reaches a server log of ours as
 * part of a page request.
 *
 * Leaving takes one press. The page does not unsubscribe on load even when
 * the link says `all=1`: mail scanners open the links in a letter, and a
 * page that acted on being opened would unsubscribe people who never saw
 * it. What `all=1` does is put that one press in front of everything else.
 */

type State =
  | { kind: "loading" }
  | { kind: "noKey" }
  | { kind: "unknown" }
  | { kind: "ready"; email: string; chosen: string[]; unsubscribed: boolean };

interface Answer {
  ok?: boolean;
  email?: string;
  interestIds?: string[];
  unsubscribed?: boolean;
  error?: string;
}

export function ManageSubscription({
  locale,
  options,
  homeHref,
}: {
  locale: Locale;
  /** Every direction somebody can be subscribed to, in page order. */
  options: SubscribeOption[];
  homeHref: string;
}) {
  const c = manageCopy;
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const leaving = params.get("all") === "1";

  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState<"" | "save" | "leave">("");
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    if (!key) {
      // Not a setState in the effect body on purpose — see the panel in the
      // admin: a synchronous one redraws before the first paint.
      Promise.resolve().then(() => {
        if (alive.current) setState({ kind: "noKey" });
      });
      return () => {
        alive.current = false;
      };
    }

    fetch(`/api/subscription?key=${encodeURIComponent(key)}`)
      .then((response) => response.json() as Promise<Answer>)
      .then((body) => {
        if (!alive.current) return;
        if (!body.ok) {
          setState({ kind: "unknown" });
          return;
        }
        setState({
          kind: "ready",
          email: body.email ?? "",
          chosen: body.interestIds ?? [],
          unsubscribed: body.unsubscribed === true,
        });
      })
      .catch(() => {
        if (alive.current) setState({ kind: "unknown" });
      });

    return () => {
      alive.current = false;
    };
  }, [key]);

  async function send(action: string, interestIds?: string[]) {
    setBusy(action === "interests" ? "save" : "leave");
    setSaved(false);
    setFailed(false);
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, action, interestIds }),
      });
      const body = (await response.json()) as Answer;
      if (!alive.current) return;
      if (!body.ok) {
        setFailed(true);
        return;
      }
      setState({
        kind: "ready",
        email: body.email ?? "",
        chosen: body.interestIds ?? [],
        unsubscribed: body.unsubscribed === true,
      });
      setSaved(action === "interests");
    } catch {
      if (alive.current) setFailed(true);
    } finally {
      if (alive.current) setBusy("");
    }
  }

  const mail = (
    <a
      href={`mailto:${emailConfig.recipient}`}
      className="underline decoration-[color:var(--gold)] underline-offset-4"
    >
      {emailConfig.recipient}
    </a>
  );

  if (state.kind === "loading") {
    return <p className="text-white/70">{c.loading[locale]}</p>;
  }

  if (state.kind === "noKey" || state.kind === "unknown") {
    const block = state.kind === "noKey" ? c.noKey : c.unknown;
    return (
      <div>
        <h2 className="font-display text-2xl">{block.title[locale]}</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-white/75">
          {block.text[locale]} {mail}
        </p>
        <a
          href={homeHref}
          className="mt-7 inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:border-white"
        >
          {c.toSite[locale]}
        </a>
      </div>
    );
  }

  if (state.unsubscribed) {
    return (
      <div>
        <h2 className="font-display text-2xl">{c.gone.title[locale]}</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-white/75">{c.gone.text[locale]}</p>
        <p className="mt-2 text-sm text-white/50">{c.address[locale](state.email)}</p>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy !== ""}
            onClick={() => void send("resubscribe")}
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:border-white disabled:opacity-50"
          >
            {c.back[locale]}
          </button>
          <a
            href={homeHref}
            className="rounded-full bg-[color:var(--gold)] px-6 py-3 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95"
          >
            {c.toSite[locale]}
          </a>
        </div>

        {failed && (
          <p role="alert" className="mt-4 text-sm text-amber-300">
            {c.failed[locale]} {mail}
          </p>
        )}
      </div>
    );
  }

  const chosen = state.chosen;
  const toggle = (id: string) =>
    setState({
      ...state,
      chosen: chosen.includes(id) ? chosen.filter((one) => one !== id) : [...chosen, id],
    });

  return (
    <div>
      <p className="text-sm text-white/50">{c.address[locale](state.email)}</p>

      {/* Arriving from "Unsubscribe" in a letter means the answer is already
          known; the one press that finishes it goes above everything else.
          Arriving from "Manage topics" means it is not, and the same button
          waits at the bottom instead. */}
      {leaving && (
        <div className="mt-5">
          <button
            type="button"
            disabled={busy !== ""}
            onClick={() => void send("unsubscribe")}
            className="rounded-full bg-[color:var(--gold)] px-7 py-3.5 font-display text-base text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-50"
          >
            {busy === "leave" ? c.unsubscribing[locale] : c.unsubscribe[locale]}
          </button>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-xl">{c.directions[locale]}</h2>
        <p className="mt-2 text-sm text-white/60">{c.directionsHint[locale]}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {options.map((option) => {
            const on = chosen.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(option.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  on
                    ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"
                    : "border-white/30 text-white/80 hover:border-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={busy !== ""}
            onClick={() => void send("interests", chosen)}
            className="rounded-full bg-[color:var(--gold)] px-6 py-3 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-50"
          >
            {busy === "save" ? c.saving[locale] : c.save[locale]}
          </button>
          {saved && <span className="text-sm text-[color:var(--gold)]">{c.saved[locale]}</span>}
        </div>
      </div>

      {!leaving && (
        <div className="mt-10 border-t border-white/10 pt-6">
          <button
            type="button"
            disabled={busy !== ""}
            onClick={() => void send("unsubscribe")}
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:border-white disabled:opacity-50"
          >
            {busy === "leave" ? c.unsubscribing[locale] : c.unsubscribe[locale]}
          </button>
        </div>
      )}

      {failed && (
        <p role="alert" className="mt-4 text-sm text-amber-300">
          {c.failed[locale]} {mail}
        </p>
      )}
    </div>
  );
}
