"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApplicationStatus, Trip, TripApplication } from "@/lib/content/types";
import {
  applicationsForOrganizer,
  listApplications,
  patchApplication,
} from "@/lib/firebase/applications";
import { listTrips } from "@/lib/firebase/trips";
import { tripsForOrganizer } from "@/lib/firebase/organizer";
import { SecondaryButton } from "../fields";
import { failureText, useAdmin, type AdminCopy } from "../i18n";
import type { AdminRole } from "../role";
import { Badge, Banner } from "../suggestions/suggestions-view";

/**
 * Who asked to come (ТЗ v4 §12, С-06).
 *
 * A list rather than a list plus a card, unlike the ideas queue, and that is
 * the whole design: С-06 wants the name, the address, the social link and
 * what somebody wrote about themselves *visible*, and ТЗ v4 §2.2 says why —
 * the owner wanted this role to «посмотреть, с кем вообще ехать придётся, и
 * выбирать». Putting the writing behind a "more" link would put the deciding
 * behind it too.
 *
 * The same screen serves an organizer with the applications to their own
 * trip. Two different queries, because the organizer's has to filter on
 * their address for the database to allow it at all; everything below that
 * is identical, since the decision they make is the same decision.
 */

const FILTERS: (ApplicationStatus | "all")[] = ["all", "new", "accepted", "declined"];

export function ApplicationsView({
  role,
  ownerEmail,
}: {
  role: AdminRole;
  /** The signed-in address — an organizer's own applications are found by it. */
  ownerEmail: string;
}) {
  const { locale, t } = useAdmin();
  const organizer = role === "organizer";

  const [data, setData] = useState<{
    applications: TripApplication[];
    trips: Trip[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [tripId, setTripId] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    const load = organizer
      ? Promise.all([applicationsForOrganizer(ownerEmail), tripsForOrganizer(ownerEmail)])
      : Promise.all([listApplications(), listTrips()]);

    load.then(
      ([applications, trips]) => {
        if (!active) return;
        setData({ applications, trips });
        setError(null);
      },
      (cause: unknown) => {
        if (!active) return;
        setData({ applications: [], trips: [] });
        setError(failureText(cause, locale, t, t.applications.loadFailed));
      },
    );

    return () => {
      active = false;
    };
    // The copy is only read in the failure path; changing the panel's
    // language must not re-run the requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken, organizer, ownerEmail]);

  const trips = useMemo(
    () => new Map((data?.trips ?? []).map((trip) => [trip.id, trip])),
    [data],
  );

  const visible = useMemo(() => {
    const all = data?.applications ?? [];
    return all.filter(
      (one) =>
        (status === "all" || one.status === status) &&
        (tripId === "all" || one.tripId === tripId),
    );
  }, [data, status, tripId]);

  async function decide(one: TripApplication, next: ApplicationStatus) {
    setBusy(one.id);
    setError(null);
    try {
      // Deciding is also reading: an application the owner has accepted or
      // turned down is one he has dealt with, and a second "mark as handled"
      // button would be a second thing to forget.
      await patchApplication(one.id, { status: next, handled: next !== "new" });
      reload();
    } catch (cause) {
      setError(failureText(cause, locale, t, t.applications.saveFailed));
    } finally {
      setBusy(null);
    }
  }

  if (data === null) {
    return <p className="text-sm text-muted-foreground">{t.applications.loading}</p>;
  }

  const fresh = (data.applications ?? []).filter((one) => one.status === "new").length;

  return (
    <div>
      {error && <Banner tone="warn">{error}</Banner>}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="text-sm text-muted-foreground">
          {data.applications.length === 0
            ? t.applications.none
            : t.applications.count(data.applications.length, fresh)}
        </p>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t.applications.filter}</span>
          <select
            id="filter-application-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ApplicationStatus | "all")}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-[color:var(--ring)]"
          >
            {FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? t.applications.statuses.all : t.applications.statuses[value]}
              </option>
            ))}
          </select>
        </label>

        {!organizer && data.trips.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t.applications.byTrip}</span>
            <select
              id="filter-application-trip"
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
              className="max-w-[16rem] rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-[color:var(--ring)]"
            >
              <option value="all">{t.applications.allTrips}</option>
              {data.trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title.en || trip.title.ru || trip.slug}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {data.applications.length === 0 ? t.applications.none : t.applications.noneHere}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((one) => (
            <li key={one.id}>
              <Card
                application={one}
                trip={trips.get(one.tripId)}
                t={t}
                busy={busy === one.id}
                onDecide={(next) => void decide(one, next)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({
  application,
  trip,
  t,
  busy,
  onDecide,
}: {
  application: TripApplication;
  trip?: Trip;
  t: AdminCopy;
  busy: boolean;
  onDecide: (status: ApplicationStatus) => void;
}) {
  const tripName = trip
    ? trip.title.en || trip.title.ru || trip.slug
    : t.applications.unknownTrip;

  return (
    <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg">
            {application.name || t.applications.noName}
          </h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={application.status} t={t} />
            <span>{tripName}</span>
            {application.createdAt && (
              <>
                <span>·</span>
                <span>{application.createdAt.slice(0, 10)}</span>
              </>
            )}
            {application.locale && (
              <>
                <span>·</span>
                <span>{t.applications.languages[application.locale]}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {application.status !== "accepted" && (
            <SecondaryButton disabled={busy} onClick={() => onDecide("accepted")}>
              {t.applications.accept}
            </SecondaryButton>
          )}
          {application.status !== "declined" && (
            <SecondaryButton tone="danger" disabled={busy} onClick={() => onDecide("declined")}>
              {t.applications.decline}
            </SecondaryButton>
          )}
          {application.status !== "new" && (
            <SecondaryButton disabled={busy} onClick={() => onDecide("new")}>
              {t.applications.undo}
            </SecondaryButton>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        <Line label={t.applications.email}>
          <a
            href={`mailto:${application.email}`}
            className="text-[color:var(--teal)] underline underline-offset-2"
          >
            {application.email}
          </a>
        </Line>
        {application.contact && (
          <Line label={t.applications.contact}>{application.contact}</Line>
        )}
        {application.city && <Line label={t.applications.city}>{application.city}</Line>}
        {application.kids && <Line label={t.applications.kids}>{application.kids}</Line>}
        {application.source && (
          <Line label={t.applications.source}>{application.source}</Line>
        )}
      </div>

      {application.links.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {application.links.map((url) => (
            <li key={url}>
              {/* Addresses typed by a stranger: a new tab, no handle on this
                  page, and no ranking passed on. */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-block max-w-[22rem] truncate rounded-full border border-border px-3 py-1 text-xs text-[color:var(--teal)] transition hover:border-foreground"
              >
                {url.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Whole, not clipped. This is what the owner is deciding on. */}
      <div className="mt-4 space-y-3">
        <Story label={t.applications.why} text={application.why} />
        <Story label={t.applications.about} text={application.about} />
        <Story label={t.applications.bring} text={application.bring} />
      </div>
    </article>
  );
}

function StatusBadge({ status, t }: { status: ApplicationStatus; t: AdminCopy }) {
  const tone = status === "accepted" ? "live" : status === "declined" ? "warn" : "normal";
  return <Badge tone={tone}>{t.applications.statuses[status]}</Badge>;
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function Story({ label, text }: { label: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div>
      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <p className="mt-1 whitespace-pre-wrap text-sm">{text}</p>
    </div>
  );
}
