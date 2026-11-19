"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { projectTypeLabel } from "@/lib/content/solutions";
import { listInquiries, markInquiry, type AdminInquiry } from "@/lib/firebase/inquiries";
import { SecondaryButton } from "../fields";
import { failureText, useAdmin, type AdminCopy } from "../i18n";
import { Badge, Banner } from "../suggestions/suggestions-view";

/**
 * Solutions enquiries (§7.6, А-17).
 *
 * The list the trip applications sit beside, and it is the same screen for
 * the same reason the spec puts them in one section: both are somebody
 * asking for something, and both are worked through the same way — read it,
 * answer it, mark it dealt with.
 *
 * "Dealt with" is the only thing the panel writes. Whether the answer was a
 * quote, a call or a polite no happens in the mailbox; the flag is just the
 * owner's own record of having got to it, which is what stops a week-old
 * enquiry being answered twice or not at all.
 */

type Filter = "all" | "new" | "handled";

const FILTERS: Filter[] = ["all", "new", "handled"];

export function InquiriesView() {
  const { locale, t } = useAdmin();
  const c = t.inquiries;

  const [list, setList] = useState<AdminInquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [token, setToken] = useState(0);
  const reload = useCallback(() => setToken((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    listInquiries().then(
      (inquiries) => {
        if (!active) return;
        setList(inquiries);
        setError(null);
      },
      (cause: unknown) => {
        if (!active) return;
        setList([]);
        setError(failureText(cause, locale, t, c.loadFailed));
      },
    );

    return () => {
      active = false;
    };
    // The copy is only read in the failure path; changing the panel's
    // language must not re-run the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const visible = useMemo(() => {
    const all = list ?? [];
    return all.filter((one) =>
      filter === "all" ? true : filter === "handled" ? one.handled : !one.handled,
    );
  }, [list, filter]);

  async function mark(one: AdminInquiry, handled: boolean) {
    setBusy(one.id);
    setError(null);
    try {
      await markInquiry(one.id, handled);
      reload();
    } catch (cause) {
      setError(failureText(cause, locale, t, c.saveFailed));
    } finally {
      setBusy(null);
    }
  }

  if (list === null) {
    return <p className="text-sm text-muted-foreground">{c.loading}</p>;
  }

  const fresh = list.filter((one) => !one.handled).length;

  return (
    <div>
      {error && <Banner tone="warn">{error}</Banner>}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="text-sm text-muted-foreground">
          {list.length === 0 ? c.none : c.count(list.length, fresh)}
        </p>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{c.filter}</span>
          <select
            id="filter-inquiry-state"
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-[color:var(--ring)]"
          >
            {FILTERS.map((value) => (
              <option key={value} value={value}>
                {c.states[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {list.length === 0 ? c.none : c.noneHere}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((one) => (
            <li key={one.id}>
              <Card
                inquiry={one}
                t={t}
                busy={busy === one.id}
                onMark={(handled) => void mark(one, handled)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({
  inquiry,
  t,
  busy,
  onMark,
}: {
  inquiry: AdminInquiry;
  t: AdminCopy;
  busy: boolean;
  onMark: (handled: boolean) => void;
}) {
  const { locale } = useAdmin();
  const c = t.inquiries;

  return (
    <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* basis, not flex-1: a line whose basis is zero never wraps, and
            the buttons squeeze this column instead — see trips-view. */}
        <div className="min-w-0 grow basis-64">
          <h3 className="font-display text-lg">{inquiry.name || c.noName}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge tone={inquiry.handled ? "normal" : "warn"}>
              {inquiry.handled ? c.states.handled : c.states.new}
            </Badge>
            <span>{projectTypeLabel(inquiry.projectType, locale)}</span>
            {inquiry.createdAt && (
              <>
                <span>·</span>
                <span>{inquiry.createdAt.slice(0, 10)}</span>
              </>
            )}
            {inquiry.locale && (
              <>
                <span>·</span>
                <span>{t.applications.languages[inquiry.locale]}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SecondaryButton disabled={busy} onClick={() => onMark(!inquiry.handled)}>
            {inquiry.handled ? c.undo : c.markHandled}
          </SecondaryButton>
        </div>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        <Line label={c.email}>
          <a
            href={`mailto:${inquiry.email}`}
            className="text-[color:var(--teal)] underline underline-offset-2"
          >
            {inquiry.email}
          </a>
        </Line>
        {inquiry.phone && (
          <Line label={c.phone}>
            <a
              href={`tel:${inquiry.phone.replace(/[^+\d]/g, "")}`}
              className="text-[color:var(--teal)] underline underline-offset-2"
            >
              {inquiry.phone}
            </a>
          </Line>
        )}
        {inquiry.source && <Line label={c.source}>{inquiry.source}</Line>}
      </div>

      {inquiry.message && (
        <div className="mt-4 rounded-xl bg-[color:var(--muted)]/50 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {c.message}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
            {inquiry.message}
          </p>
        </div>
      )}
    </article>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="min-w-0">
      <span className="text-muted-foreground">{label}: </span>
      <span className="break-words">{children}</span>
    </p>
  );
}
