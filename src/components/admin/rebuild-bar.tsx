"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onRebuildRequested, readRebuild, startRebuild, type RebuildState } from "@/lib/rebuild";

/**
 * What the site is doing, in the frame of every admin screen (А-09).
 *
 * The panel writes to the database, and the site a visitor sees is rebuilt
 * from it — so between pressing "Опубликовать" and the page existing there is
 * a minute during which nothing is wrong and nothing has happened yet. Without
 * a line saying so, the owner's only way to find out is to open the site and
 * refresh it.
 *
 * It says nothing at all when there is no Worker to ask, which is the case
 * while running `next dev`.
 */

/** How often to ask again while a build is running. */
const TICK = 5000;

/**
 * How long a build just asked for is believed in, whatever GitHub says.
 *
 * A run does not appear in the workflow's list the instant it is dispatched,
 * so the first answer after pressing the button can still describe the
 * previous build. Without this the indicator would say "updated 5 minutes ago"
 * immediately after the owner started one, which is the opposite of what
 * happened.
 */
const GRACE = 20000;

export function RebuildBar() {
  const [state, setState] = useState<RebuildState | null>(null);
  const [asking, setAsking] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);
  const alive = useRef(true);
  const believeUntil = useRef(0);

  const refresh = useCallback(async () => {
    const next = await readRebuild();
    if (!alive.current) return;
    // A build we have just asked for outranks a list that has not caught up.
    if (next.kind === "idle" && Date.now() < believeUntil.current) return;
    setState(next);
  }, []);

  useEffect(() => {
    alive.current = true;
    void refresh();
    // A form elsewhere in the panel can ask for a build; the indicator should
    // show it without waiting for the next tick.
    const stop = onRebuildRequested(() => {
      believeUntil.current = Date.now() + GRACE;
      setState({ kind: "running" });
    });
    return () => {
      alive.current = false;
      stop();
    };
  }, [refresh]);

  // Only poll while something is happening: an idle panel should not talk to
  // GitHub every ten seconds for the rest of the day.
  useEffect(() => {
    if (state?.kind !== "running") return;
    const timer = setInterval(() => void refresh(), TICK);
    return () => clearInterval(timer);
  }, [state?.kind, refresh]);

  if (!state || state.kind === "absent") return null;

  if (state.kind === "unconfigured") {
    return (
      <Line>
        <span className="text-muted-foreground">
          Автоматическое обновление сайта не настроено — у воркера нет токена GitHub.
        </span>
      </Line>
    );
  }

  const running = state.kind === "running";

  async function ask() {
    setAsking(true);
    setRefused(null);
    believeUntil.current = Date.now() + GRACE;

    const result = await startRebuild();
    if (!alive.current) return;

    if (result.kind === "idle") {
      // The Worker refused: a build has just run, and it already carries
      // whatever was saved before it started. So there is nothing to wait for.
      believeUntil.current = 0;
      setRefused("Сайт обновлялся только что — изменения уже на нём.");
    }

    setState(result);
    setAsking(false);
  }

  return (
    <Line>
      {running ? (
        <span className="inline-flex items-center gap-2 font-medium text-[color:var(--teal)]">
          <Spinner />
          Сайт обновляется…
        </span>
      ) : (
        <span className="text-muted-foreground">
          {state.conclusion === "failure" ? (
            <span className="text-amber-700">
              Последнее обновление сайта не удалось{when(state.finishedAt)}.
            </span>
          ) : (
            <>Сайт обновлён{when(state.finishedAt)}.</>
          )}
        </span>
      )}

      <button
        type="button"
        onClick={() => void ask()}
        disabled={running || asking}
        className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium transition hover:border-foreground disabled:opacity-50"
      >
        {asking ? "…" : "Обновить сайт"}
      </button>

      {refused && <span className="text-xs text-muted-foreground">{refused}</span>}
    </Line>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">{children}</div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[color:var(--teal)] border-t-transparent"
    />
  );
}

/**
 * "две минуты назад" rather than a timestamp: the owner wants to know whether
 * their change is on the site, not what o'clock it was.
 */
function when(iso?: string): string {
  if (!iso) return "";
  const seconds = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 90) return " только что";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return ` ${minutes} ${plural(minutes, "минуту", "минуты", "минут")} назад`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return ` ${hours} ${plural(hours, "час", "часа", "часов")} назад`;

  const days = Math.round(hours / 24);
  return ` ${days} ${plural(days, "день", "дня", "дней")} назад`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
