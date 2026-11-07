"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { effectiveBookingStatus, isPast, todayUtc } from "@/lib/content/schedule";
import type { Interest, Person, Trip } from "@/lib/content/types";
import { listInterests } from "@/lib/firebase/interests";
import { tripsForOrganizer } from "@/lib/firebase/organizer";
import { listPeople } from "@/lib/firebase/people";
import {
  blankTrip,
  duplicateTrip,
  listTrips,
  setTripStatus,
  stripTripIds,
  type TripDraft,
} from "@/lib/firebase/trips";
import { rebuildSoon } from "@/lib/rebuild";
import { PrimaryButton, SecondaryButton } from "../fields";
import { failureText, useAdmin, type AdminCopy } from "../i18n";
import type { AdminRole } from "../role";
import { TripForm } from "./trip-form";

/**
 * §7.2: the list of trips, its filters, and the actions that move a trip
 * between draft, published and the archive (А-10, А-11, А-13).
 *
 * The same screen serves an organizer, with one trip in it and none of the
 * actions that are the owner's (ТЗ v4, §2.4). Two things differ and both
 * matter. The list is fetched with a filter on their address — without it
 * `firestore.rules` refuses the query whole, and the panel would show an
 * error or, worse, an empty list reading "you have no trips". And the trip
 * form is the same component: what an organizer may not change is enforced
 * by the database, so the screen only has to avoid offering it.
 */

type StatusFilter = "all" | "draft" | "published" | "past" | "archived";

/** Only the values: the words for them live in the copy files, keyed the same. */
const STATUS_FILTERS: StatusFilter[] = ["all", "draft", "published", "past", "archived"];

export function TripsView({
  role,
  ownerEmail,
}: {
  role: AdminRole;
  /** The signed-in address, which is what an organizer's trips are keyed on. */
  ownerEmail: string;
}) {
  const organizer = role === "organizer";
  const { locale, t } = useAdmin();
  const router = useRouter();
  const params = useSearchParams();
  const editing = params.get("edit");

  const [data, setData] = useState<{
    trips: Trip[];
    interests: Interest[];
    people: Person[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [interestId, setInterestId] = useState("all");
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    Promise.all([
      organizer ? tripsForOrganizer(ownerEmail) : listTrips(),
      listInterests(),
      listPeople(),
    ]).then(
      ([trips, interests, people]) => {
        if (!active) return;
        setData({ trips, interests, people });
        setError(null);
      },
      (cause: unknown) => {
        if (!active) return;
        setData({ trips: [], interests: [], people: [] });
        setError(failureText(cause, locale, t, t.trips.loadFailed));
      },
    );

    return () => {
      active = false;
    };
    // The copy is only read in the failure path, so changing the panel's
    // language must not re-run this — that would be three wasted requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken, organizer, ownerEmail]);

  const today = todayUtc();

  const visible = useMemo(() => {
    if (!data) return [];
    return data.trips.filter((trip) => {
      if (interestId !== "all" && trip.interestId !== interestId) return false;
      switch (status) {
        case "draft":
          return trip.status === "draft";
        case "archived":
          return trip.status === "archived";
        case "past":
          return trip.status === "published" && isPast(trip, today);
        case "published":
          return trip.status === "published" && !isPast(trip, today);
        default:
          return true;
      }
    });
  }, [data, interestId, status, today]);

  const go = (edit: string | null) =>
    router.push(`/admin/?view=trips${edit ? `&edit=${edit}` : ""}`);

  async function act(trip: Trip, what: () => Promise<string | null>) {
    setBusyId(trip.id);
    setNotice(null);
    try {
      const message = await what();
      if (message) setNotice(message);
      reload();
    } catch (cause) {
      setError(failureText(cause, locale, t, t.trips.loadFailed));
    } finally {
      setBusyId(null);
    }
  }

  if (data === null) {
    return <p className="text-sm text-muted-foreground">{t.trips.loading}</p>;
  }

  const { trips, interests, people } = data;

  if (editing) {
    const current = editing === "new" ? null : trips.find((t) => t.id === editing);
    if (editing !== "new" && !current) {
      return (
        <Empty text={t.trips.notFound}>
          <PrimaryButton onClick={() => go(null)}>{t.field.toList}</PrimaryButton>
        </Empty>
      );
    }

    // An organizer never starts a trip, so "set up a direction first" is
    // advice they can do nothing with.
    if (interests.length === 0 && !organizer) {
      return (
        <Empty text={t.trips.noInterests}>
          <PrimaryButton onClick={() => router.push("/admin/?view=interests&edit=new")}>
            {t.trips.toInterests}
          </PrimaryButton>
        </Empty>
      );
    }

    const initial: TripDraft = current ? stripTripIds(current) : blankTrip("");

    return (
      <TripForm
        // Remounts when switching between trips, so one trip's draft can never
        // be left in the fields while another is on screen.
        key={editing}
        role={role}
        id={current?.id ?? null}
        initial={initial}
        interests={interests}
        people={people}
        allTrips={trips}
        onDone={() => {
          reload();
          go(null);
        }}
        onCancel={() => go(null)}
      />
    );
  }

  if (organizer) {
    return (
      <div>
        {error && <Banner tone="warn">{error}</Banner>}
        {notice && <Banner tone="info">{notice}</Banner>}

        <p className="text-sm text-muted-foreground">
          {trips.length === 0
            ? t.trips.mine.none
            : trips.length === 1
              ? t.trips.mine.one
              : t.trips.mine.several(trips.length)}
        </p>

        {trips.length > 0 && (
          <ul className="mt-4 space-y-3">
            {trips.map((trip) => {
              const interest = interests.find((i) => i.id === trip.interestId);
              return (
                <li
                  key={trip.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {trip.title.en || trip.title.ru || t.trips.untitled}
                      </span>
                      <StatusBadge
                        status={trip.status}
                        past={trip.status === "published" && isPast(trip, today)}
                        t={t}
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {interest?.name.en ?? t.trips.noInterest} · {trip.startDate} — {trip.endDate}
                    </p>
                  </div>
                  <SecondaryButton onClick={() => go(trip.id)}>
                    {t.trips.edit}
                  </SecondaryButton>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-6 max-w-2xl text-xs text-muted-foreground">
          {t.trips.mine.cannotPublish}
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && <Banner tone="warn">{error}</Banner>}
      {notice && <Banner tone="info">{notice}</Banner>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Filter
            id="filter-status"
            label={t.trips.filterStatus}
            value={status}
            options={STATUS_FILTERS.map((value) => ({
              value,
              label: t.trips.statuses[value],
            }))}
            onChange={(value) => setStatus(value as StatusFilter)}
          />
          <Filter
            id="filter-interest"
            label={t.trips.filterInterest}
            value={interestId}
            options={[
              { value: "all", label: t.trips.statuses.all },
              ...interests.map((interest) => ({
                value: interest.id,
                label: interest.name.en || interest.slug,
              })),
            ]}
            onChange={setInterestId}
          />
        </div>
        <PrimaryButton onClick={() => go("new")}>{t.trips.create}</PrimaryButton>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {trips.length === 0
          ? t.trips.none
          : t.trips.showing(visible.length, trips.length)}
      </p>

      {visible.length > 0 && (
        <ul className="mt-4 space-y-3">
          {visible.map((trip) => {
            const interest = interests.find((i) => i.id === trip.interestId);
            const past = trip.status === "published" && isPast(trip, today);
            const busy = busyId === trip.id;

            return (
              <li
                key={trip.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {trip.title.en || trip.title.ru || t.trips.untitled}
                    </span>
                    <StatusBadge status={trip.status} past={past} t={t} />
                    {trip.kidFriendly && <Badge>{t.trips.badges.kidFriendly}</Badge>}
                    {past && !trip.showInPast && (
                      <Badge tone="warn">{t.trips.badges.hiddenInPast}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {interest?.name.en ?? t.trips.noInterest} · {trip.startDate} — {trip.endDate}
                    {trip.status === "published" &&
                      ` · ${t.trips.booking[effectiveBookingStatus(trip, today)]}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SecondaryButton onClick={() => go(trip.id)} disabled={busy}>
                    {t.trips.edit}
                  </SecondaryButton>

                  <SecondaryButton
                    disabled={busy}
                    onClick={() =>
                      void act(trip, async () => {
                        await duplicateTrip(trip, trips);
                        return t.trips.duplicated;
                      })
                    }
                  >
                    {busy ? "…" : t.trips.duplicate}
                  </SecondaryButton>

                  {trip.status === "archived" ? (
                    <SecondaryButton
                      disabled={busy}
                      onClick={() =>
                        void act(trip, async () => {
                          await setTripStatus(trip, "restore");
                        if (trip.statusBeforeArchive === "published") rebuildSoon();
                          return trip.statusBeforeArchive === "published"
                            ? t.trips.restoredLive
                            : t.trips.restoredDraft;
                        })
                      }
                    >
                      {t.trips.restore}
                    </SecondaryButton>
                  ) : (
                    <SecondaryButton
                      disabled={busy}
                      onClick={() =>
                        void act(trip, async () => {
                          await setTripStatus(trip, "archived");
                        if (trip.status === "published") rebuildSoon();
                          return t.trips.archived;
                        })
                      }
                    >
                      {t.trips.archive}
                    </SecondaryButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {trips.length > 0 && visible.length === 0 && (
        <Empty text={t.trips.emptyFilter}>
          <SecondaryButton
            onClick={() => {
              setStatus("all");
              setInterestId("all");
            }}
          >
            {t.trips.showAll}
          </SecondaryButton>
        </Empty>
      )}
    </div>
  );
}

function Filter({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-[color:var(--ring)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({
  status,
  past,
  t,
}: {
  status: Trip["status"];
  past: boolean;
  t: AdminCopy;
}) {
  if (status === "archived") {
    return <Badge tone="warn">{t.trips.badges.archived}</Badge>;
  }
  if (status === "published") {
    return past ? (
      <Badge>{t.trips.badges.past}</Badge>
    ) : (
      <Badge tone="live">{t.trips.badges.published}</Badge>
    );
  }
  return <Badge>{t.trips.badges.draft}</Badge>;
}

function Badge({
  children,
  tone = "normal",
}: {
  children: React.ReactNode;
  tone?: "normal" | "warn" | "live";
}) {
  const styles = {
    normal: "bg-[color:var(--muted)] text-muted-foreground",
    warn: "bg-amber-100 text-amber-900",
    live: "bg-[color:var(--teal)]/15 text-[color:var(--teal)]",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${styles[tone]}`}>{children}</span>;
}

function Banner({
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

