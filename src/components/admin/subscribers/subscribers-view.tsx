"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { downloadCsv, toCsv, type CsvSeparator } from "@/lib/content/csv";
import type { Interest, Subscriber } from "@/lib/content/types";
import { listInterests } from "@/lib/firebase/interests";
import { deleteSubscriber, listSubscribers } from "@/lib/firebase/subscribers";
import { PrimaryButton, SecondaryButton } from "../fields";
import { failureText, useAdmin } from "../i18n";

/**
 * Who is on the mailing list (А-16).
 *
 * The screen answers three questions and no more: how many people are
 * subscribed to each direction, who exactly, and how to get that list out of
 * here. Everything else about a subscriber — changing their directions,
 * taking them off — is theirs to do from the link in the letter, which is
 * why the only action here is the one they cannot do themselves: deleting
 * the record entirely at their request.
 *
 * The numbers per direction are counted here rather than stored. They are a
 * view of the list the panel has already read, and a stored count is a count
 * that can disagree with the list under it.
 */

type State = "all" | "active" | "unsubscribed" | "viaInterested";

const STATES: State[] = ["all", "active", "unsubscribed", "viaInterested"];

export function SubscribersView() {
  const { locale, t } = useAdmin();
  const c = t.subscriberList;

  const [data, setData] = useState<{
    subscribers: Subscriber[];
    interests: Interest[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [state, setState] = useState<State>("all");
  const [direction, setDirection] = useState("all");
  const [search, setSearch] = useState("");
  const [asking, setAsking] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [token, setToken] = useState(0);
  const reload = useCallback(() => setToken((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    Promise.all([listSubscribers(), listInterests()]).then(
      ([subscribers, interests]) => {
        if (!active) return;
        setData({ subscribers, interests });
        setError(null);
      },
      (cause: unknown) => {
        if (!active) return;
        setData({ subscribers: [], interests: [] });
        setError(failureText(cause, locale, t, c.loadFailed));
      },
    );

    return () => {
      active = false;
    };
    // The copy is only read in the failure path; changing the panel's
    // language must not re-read the database.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const interest of data?.interests ?? []) {
      map.set(interest.id, interest.name.en || interest.name.ru || interest.slug);
    }
    return map;
  }, [data]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const one of data?.subscribers ?? []) {
      if (one.unsubscribed) continue;
      for (const id of one.interestIds) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [data]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (data?.subscribers ?? []).filter((one) => {
      if (direction !== "all" && !one.interestIds.includes(direction)) return false;
      if (state === "active" && one.unsubscribed) return false;
      if (state === "unsubscribed" && !one.unsubscribed) return false;
      if (state === "viaInterested" && !one.viaInterested) return false;
      if (needle && !one.email.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data, direction, state, search]);

  async function remove(one: Subscriber) {
    setBusy(one.id);
    setNotice(null);
    try {
      await deleteSubscriber(one.id);
      setNotice(c.removed);
      setAsking(null);
      reload();
    } catch (cause) {
      setError(failureText(cause, locale, t, c.removeFailed));
    } finally {
      setBusy(null);
    }
  }

  function download() {
    if (!data) return;
    // The panel's language picks the separator — see lib/content/csv.
    const separator: CsvSeparator = locale === "ru" ? ";" : ",";
    const header = [
      c.columns.email,
      c.columns.directions,
      c.columns.language,
      c.columns.source,
      c.columns.viaInterested,
      c.columns.unsubscribed,
      c.columns.createdAt,
      c.columns.updatedAt,
    ];
    const rows = visible.map((one) => [
      one.email,
      one.interestIds.map((id) => names.get(id) ?? id).join(" / "),
      one.locale.toUpperCase(),
      one.source ?? "",
      one.viaInterested ? c.yes : c.no,
      one.unsubscribed ? c.yes : c.no,
      one.createdAt.slice(0, 10),
      one.updatedAt.slice(0, 10),
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`nazarov-subscribers-${stamp}.csv`, toCsv(header, rows, separator));
  }

  if (data === null) {
    return <p className="text-sm text-muted-foreground">{c.loading}</p>;
  }

  const total = data.subscribers.length;
  const active = data.subscribers.filter((one) => !one.unsubscribed).length;

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-6 rounded-xl border border-border bg-[color:var(--muted)] p-4 text-sm">
          {notice}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {total === 0 ? c.none : c.count(total, active)}
      </p>

      {counts.size > 0 && (
        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {c.byDirection}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.interests.map((interest) => (
              <span
                key={interest.id}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm"
              >
                {interest.name.en || interest.slug}{" "}
                <span className="font-semibold">{counts.get(interest.id) ?? 0}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {total > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <Field id="subscriber-direction" label={c.filterDirection}>
              <select
                id="subscriber-direction"
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-[color:var(--ring)]"
              >
                <option value="all">{c.states.all}</option>
                {data.interests.map((interest) => (
                  <option key={interest.id} value={interest.id}>
                    {interest.name.en || interest.slug}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="subscriber-state" label={c.filterState}>
              <select
                id="subscriber-state"
                value={state}
                onChange={(event) => setState(event.target.value as State)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-[color:var(--ring)]"
              >
                {STATES.map((one) => (
                  <option key={one} value={one}>
                    {c.states[one]}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="subscriber-search" label={c.search}>
              <input
                id="subscriber-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={c.searchPlaceholder}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-[color:var(--ring)]"
              />
            </Field>

            <PrimaryButton onClick={download}>{c.download}</PrimaryButton>
          </div>

          <p className="mt-2 max-w-2xl text-xs text-muted-foreground">{c.downloadHint}</p>

          <p className="mt-5 text-sm text-muted-foreground">
            {c.showing(visible.length, total)}
          </p>
        </>
      )}

      {visible.length > 0 && (
        <ul className="mt-4 space-y-3">
          {visible.map((one) => (
            <li
              key={one.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5"
            >
              {/* basis, not flex-1: a line whose basis is zero never wraps, and
                  the buttons squeeze this column instead — see trips-view. */}
              <div className="min-w-0 grow basis-64">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium break-all">{one.email}</span>
                  {one.viaInterested && <Badge>{c.badges.viaInterested}</Badge>}
                  {one.unsubscribed && <Badge tone="warn">{c.badges.unsubscribed}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {one.interestIds.length > 0
                    ? one.interestIds.map((id) => names.get(id) ?? id).join(" · ")
                    : c.noDirections}
                  {" · "}
                  {one.locale.toUpperCase()}
                  {one.createdAt && ` · ${one.createdAt.slice(0, 10)}`}
                  {one.source && ` · ${one.source}`}
                </p>
              </div>

              {asking === one.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">{c.removeConfirm}</span>
                  <SecondaryButton
                    tone="danger"
                    disabled={busy === one.id}
                    onClick={() => void remove(one)}
                  >
                    {t.field.deleteYes}
                  </SecondaryButton>
                  <SecondaryButton disabled={busy === one.id} onClick={() => setAsking(null)}>
                    {t.field.deleteNo}
                  </SecondaryButton>
                </div>
              ) : (
                <SecondaryButton tone="danger" onClick={() => setAsking(one.id)}>
                  {c.remove}
                </SecondaryButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {total > 0 && visible.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">{c.emptyFilter}</p>
          <div className="mt-4">
            <SecondaryButton
              onClick={() => {
                setState("all");
                setDirection("all");
                setSearch("");
              }}
            >
              {c.showAll}
            </SecondaryButton>
          </div>
        </div>
      )}

      {asking && <p className="mt-4 max-w-2xl text-xs text-muted-foreground">{c.removeHint}</p>}
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-[11rem] grow sm:grow-0">
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Badge({
  children,
  tone = "normal",
}: {
  children: React.ReactNode;
  tone?: "normal" | "warn";
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        tone === "warn"
          ? "bg-amber-100 text-amber-900"
          : "bg-[color:var(--muted)] text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}
