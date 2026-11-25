"use client";

import { useMemo, useState } from "react";
import {
  covers,
  eventsInMonth,
  monthGrid,
  monthOf,
  monthRange,
  shiftMonth,
  type CalendarEvent,
  type MonthKey,
} from "@/lib/content/calendar";
import type { Locale } from "@/i18n/config";
import { todayInBrowserUtc, useClientValue } from "@/lib/client-value";
import { writeMonth, writeSpan } from "@/lib/dates";
import { calendarCopy } from "./calendar-copy";

/**
 * The calendar itself: one month at a time, with the month's trips listed
 * under it.
 *
 * Two views of the same thing, and both are needed. The grid answers "what
 * does February look like" at a glance — where the trips fall, how much of
 * the month they take, whether two of them overlap. The list answers "what
 * is it, then": a name, a place, a direction, a way in. A grid alone would
 * be a wall of coloured squares on a phone, where a cell is forty pixels
 * wide and a trip's name does not fit in it.
 *
 * Everything is in the page already — the whole year's trips are a few
 * hundred bytes — so moving between months is instant and needs nothing from
 * the network. That is also why the arrows stop at the first and the last
 * month that have something in them: past that there is nothing to show, and
 * an arrow that leads to twelve empty screens is an arrow that lies.
 */

/** Sunday first in English, Monday first in Russian. */
const weekStartFor = (locale: Locale): 0 | 1 => (locale === "ru" ? 1 : 0);

const tagFor = (locale: Locale) => (locale === "ru" ? "ru-RU" : "en-GB");

export function CalendarView({
  events,
  locale,
  today,
}: {
  events: CalendarEvent[];
  locale: Locale;
  /** The day the page was printed; the browser corrects it below. */
  today: string;
}) {
  const c = calendarCopy;
  const weekStart = weekStartFor(locale);

  /**
   * Which month to open on: the one holding the next trip that has not
   * finished, or the last month there is when everything is over.
   *
   * Not simply the current month, because the current month is usually empty
   * — there are four or five trips in a year — and a calendar that opens on
   * an empty grid reads as a calendar with nothing in it.
   */
  const opening = (now: string): MonthKey => {
    const next = events.find((event) => event.end >= now);
    if (next) return monthOf(next.start);
    const { last } = monthRange(events);
    return last ?? monthOf(now);
  };

  // "Today" has two values here: the day the file was printed and the day
  // the visitor is reading it, and on a static page served from a cache they
  // are rarely the same. `useClientValue` renders the printed one while
  // hydrating and the real one immediately after — see its own file for what
  // happens without that.
  const now = useClientValue(todayInBrowserUtc, today);

  // The month on screen is the one the visitor last asked for, and until
  // they ask, the one this works out for itself. Derived rather than copied
  // into state, so the correction above moves it too.
  const [asked, setAsked] = useState<MonthKey | null>(null);
  const month = asked ?? opening(now);
  const setMonth = setAsked;

  const { first, last } = useMemo(() => monthRange(events), [events]);
  const cells = useMemo(() => monthGrid(month, weekStart), [month, weekStart]);
  const listed = useMemo(() => eventsInMonth(events, month), [events, month]);

  const title = useMemo(() => writeMonth(month, locale), [month, locale]);

  const weekdays = useMemo(() => {
    const format = new Intl.DateTimeFormat(tagFor(locale), {
      weekday: "short",
      timeZone: "UTC",
    });
    // 2027-02-07 is a Sunday, which makes the offsets below plain arithmetic.
    return Array.from({ length: 7 }, (_, index) =>
      format.format(new Date(Date.UTC(2027, 1, 7 + ((index + weekStart) % 7)))),
    );
  }, [locale, weekStart]);

  const atStart = Boolean(first) && month <= (first as string);
  const atEnd = Boolean(last) && month >= (last as string);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <div>
        <div className="flex items-center justify-between gap-3">
          <Arrow
            label={c.previous[locale]}
            disabled={atStart}
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            ‹
          </Arrow>
          {/* Capitalised by hand: Russian writes month names in lower case,
              and a heading is a heading in both languages. */}
          <h2 className="font-display text-xl capitalize sm:text-2xl">{title}</h2>
          <Arrow
            label={c.next[locale]}
            disabled={atEnd}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            ›
          </Arrow>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-px text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {weekdays.map((day) => (
            <span key={day} className="py-1">
              {day}
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const on = listed.filter((event) => covers(event, cell.iso));
            const busy = on.length > 0 && cell.inMonth;
            const over = on.some((event) => event.past);

            return (
              <span
                key={cell.iso}
                // A day with something on it is named in full for a screen
                // reader; the colour alone says nothing to one.
                title={on.map((event) => event.title).join(", ") || undefined}
                className={`grid aspect-square place-items-center rounded-lg text-sm ${
                  cell.inMonth ? "" : "text-muted-foreground/35"
                } ${
                  busy
                    ? over
                      ? "bg-muted font-medium text-foreground"
                      : "bg-[color:var(--gold)]/85 font-semibold text-[color:var(--gold-foreground)]"
                    : cell.iso === now
                      ? "border border-[color:var(--teal)] font-semibold"
                      : "bg-card/60"
                }`}
              >
                {cell.day}
              </span>
            );
          })}
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Key className="bg-[color:var(--gold)]/85">{c.keyUpcoming[locale]}</Key>
          <Key className="bg-muted">{c.keyPast[locale]}</Key>
        </p>
      </div>

      <div>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--teal)]">
          {c.inThisMonth[locale]}
        </h3>

        {listed.length === 0 ? (
          <p className="mt-4 text-muted-foreground">{c.nothing[locale]}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {listed.map((event) => (
              <li key={event.id}>
                <a
                  href={event.href}
                  className={`block rounded-2xl border border-border bg-card p-4 transition hover:border-foreground ${
                    event.past ? "opacity-70" : ""
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider text-[color:var(--teal)]">
                    {writeSpan(event.start, event.end, locale)}
                  </span>
                  <span className="mt-1 block font-medium">{event.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {[event.direction, event.place].filter(Boolean).join(" · ")}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <Tag>{c.booking[event.booking][locale]}</Tag>
                    {event.kidFriendly && <Tag>{c.kidFriendly[locale]}</Tag>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Arrow({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-lg transition hover:border-foreground disabled:opacity-30 disabled:hover:border-border"
    >
      {children}
    </button>
  );
}

function Key({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className={`h-3 w-3 rounded ${className}`} />
      {children}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
      {children}
    </span>
  );
}
