"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdventureSuggestion, Interest, SuggestionStatus, Trip } from "@/lib/content/types";
import { listInterests } from "@/lib/firebase/interests";
import { listSuggestions } from "@/lib/firebase/suggestions";
import { listTrips } from "@/lib/firebase/trips";
import { PrimaryButton, SecondaryButton } from "../fields";
import { failureText, useAdmin, type AdminCopy } from "../i18n";
import { SuggestionDetail } from "./suggestion-detail";

/**
 * «Идеи поездок» — the moderation queue (ТЗ v4, §3.4).
 *
 * Which screen is showing travels in the address (`?view=suggestions&open=…`),
 * the way it does in every other section: a reload keeps the owner where they
 * were, and Back steps out of an idea rather than out of the panel.
 *
 * The trips are loaded alongside the ideas, not when the owner presses "create
 * a trip from this idea". They are needed before that — an address has to be
 * unique inside its direction, so making one means knowing the addresses that
 * already exist — and a list fetched at the moment of a button press is a list
 * that makes the button slow.
 */

const STATUS_FILTERS: (SuggestionStatus | "all")[] = [
  "all",
  "new",
  "underReview",
  "needsInfo",
  "approved",
  "published",
  "declined",
];

export function SuggestionsView() {
  const { locale, t } = useAdmin();
  const router = useRouter();
  const params = useSearchParams();
  const open = params.get("open");

  const [data, setData] = useState<{
    suggestions: AdventureSuggestion[];
    interests: Interest[];
    trips: Trip[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SuggestionStatus | "all">("all");
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    Promise.all([listSuggestions(), listInterests(), listTrips()]).then(
      ([suggestions, interests, trips]) => {
        if (!active) return;
        setData({ suggestions, interests, trips });
        setError(null);
      },
      (cause: unknown) => {
        if (!active) return;
        setData({ suggestions: [], interests: [], trips: [] });
        setError(failureText(cause, locale, t, t.suggestions.loadFailed));
      },
    );

    return () => {
      active = false;
    };
    // The copy is only read in the failure path; changing the panel's language
    // must not re-run three requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);

  const visible = useMemo(() => {
    if (!data) return [];
    return status === "all"
      ? data.suggestions
      : data.suggestions.filter((item) => item.status === status);
  }, [data, status]);

  const go = (id: string | null) =>
    router.push(`/admin/?view=suggestions${id ? `&open=${id}` : ""}`);

  if (data === null) {
    return <p className="text-sm text-muted-foreground">{t.suggestions.loading}</p>;
  }

  const { suggestions, interests, trips } = data;

  if (open) {
    const current = suggestions.find((item) => item.id === open);
    if (!current) {
      return (
        <Empty text={t.suggestions.notFound}>
          <PrimaryButton onClick={() => go(null)}>{t.suggestions.back}</PrimaryButton>
        </Empty>
      );
    }

    return (
      <SuggestionDetail
        suggestion={current}
        interests={interests}
        trips={trips}
        onChanged={reload}
        onBack={() => go(null)}
      />
    );
  }

  const fresh = suggestions.filter((item) => item.status === "new").length;

  return (
    <div>
      {error && <Banner tone="warn">{error}</Banner>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label
            htmlFor="filter-suggestion-status"
            className="block text-xs font-medium text-muted-foreground"
          >
            {t.suggestions.filterStatus}
          </label>
          <select
            id="filter-suggestion-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as SuggestionStatus | "all")}
            className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-[color:var(--ring)]"
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                {t.suggestions.statuses[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {suggestions.length === 0
          ? t.suggestions.none
          : t.suggestions.count(suggestions.length, fresh)}
      </p>

      {visible.length > 0 && (
        <ul className="mt-4 space-y-3">
          {visible.map((item) => {
            const interest = interests.find((one) => one.id === item.interestId);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {item.title.trim() || t.suggestions.untitled}
                    </span>
                    <StatusBadge status={item.status} t={t} />
                    {item.tripId && <Badge tone="live">{t.suggestions.openTrip}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.categoryOther?.trim() ||
                      interest?.name.en ||
                      t.suggestions.noDirection}
                    {" · "}
                    {item.name || item.email}
                    {item.createdAt && ` · ${item.createdAt.slice(0, 10)}`}
                  </p>
                </div>

                <SecondaryButton onClick={() => go(item.id)}>
                  {t.suggestions.open}
                </SecondaryButton>
              </li>
            );
          })}
        </ul>
      )}

      {suggestions.length > 0 && visible.length === 0 && (
        <Empty text={t.suggestions.emptyFilter}>
          <SecondaryButton onClick={() => setStatus("all")}>
            {t.suggestions.showAll}
          </SecondaryButton>
        </Empty>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
  t,
}: {
  status: SuggestionStatus;
  t: AdminCopy;
}) {
  const tone: BadgeTone =
    status === "new"
      ? "live"
      : status === "declined"
        ? "warn"
        : status === "approved" || status === "published"
          ? "live"
          : "normal";
  return <Badge tone={tone}>{t.suggestions.statuses[status]}</Badge>;
}

type BadgeTone = "normal" | "warn" | "live";

export function Badge({
  children,
  tone = "normal",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  const styles = {
    normal: "bg-[color:var(--muted)] text-muted-foreground",
    warn: "bg-amber-100 text-amber-900",
    live: "bg-[color:var(--teal)]/15 text-[color:var(--teal)]",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${styles[tone]}`}>{children}</span>;
}

export function Banner({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "warn" | "info";
}) {
  return (
    <div
      role="alert"
      className={`mb-6 rounded-xl border p-4 text-sm ${
        tone === "warn"
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-border bg-[color:var(--muted)] text-foreground"
      }`}
    >
      {children}
    </div>
  );
}

function Empty({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
