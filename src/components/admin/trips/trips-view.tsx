"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { effectiveBookingStatus, todayUtc } from "@/lib/content/schedule";
import type { Interest, Person, Trip } from "@/lib/content/types";
import { listInterests } from "@/lib/firebase/interests";
import { listPeople } from "@/lib/firebase/people";
import { blankTrip, listTrips, type TripDraft } from "@/lib/firebase/trips";
import { PrimaryButton, SecondaryButton } from "../fields";
import { TripForm } from "./trip-form";

/**
 * §7.2, the part plan item 1.4 covers: reaching the trip form and getting back
 * out of it. Filters, publishing from the list, archiving and duplicating are
 * item 1.7 — this list exists so the form has a door.
 */
export function TripsView() {
  const router = useRouter();
  const params = useSearchParams();
  const editing = params.get("edit");

  const [data, setData] = useState<{
    trips: Trip[];
    interests: Interest[];
    people: Person[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    Promise.all([listTrips(), listInterests(), listPeople()]).then(
      ([trips, interests, people]) => {
        if (!active) return;
        setData({ trips, interests, people });
        setError(null);
      },
      (cause: unknown) => {
        if (!active) return;
        setData({ trips: [], interests: [], people: [] });
        setError(describe(cause));
      },
    );

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const go = (edit: string | null) =>
    router.push(`/admin/?view=trips${edit ? `&edit=${edit}` : ""}`);

  if (data === null) {
    return <p className="text-sm text-muted-foreground">Загружаем поездки…</p>;
  }

  const { trips, interests, people } = data;

  if (editing) {
    const current = editing === "new" ? null : trips.find((t) => t.id === editing);
    if (editing !== "new" && !current) {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Поездка не найдена.</p>
          <div className="mt-4">
            <PrimaryButton onClick={() => go(null)}>К списку</PrimaryButton>
          </div>
        </div>
      );
    }

    if (interests.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Сначала заведите хотя бы одно направление — поездка должна куда-то попасть.
          </p>
          <div className="mt-4">
            <PrimaryButton onClick={() => router.push("/admin/?view=interests&edit=new")}>
              К направлениям
            </PrimaryButton>
          </div>
        </div>
      );
    }

    const initial: TripDraft = current ? stripIds(current) : blankTrip("");

    return (
      <TripForm
        // Remounts the form when switching between trips, so one trip's draft
        // can never be left in the fields while another one is on screen.
        key={editing}
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

  const today = todayUtc();

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {trips.length === 0
            ? "Поездок пока нет."
            : `Поездок: ${trips.length}. Фильтры, архив и дублирование появятся на пункте 1.7.`}
        </p>
        <PrimaryButton onClick={() => go("new")}>Новая поездка</PrimaryButton>
      </div>

      {trips.length > 0 && (
        <ul className="mt-6 space-y-3">
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
                      {trip.title.en || trip.title.ru || "Без названия"}
                    </span>
                    <StatusBadge status={trip.status} />
                    {trip.kidFriendly && <Badge>с детьми</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {interest?.name.en ?? "направление не задано"} · {trip.startDate} — {trip.endDate}
                    {trip.status === "published" &&
                      ` · ${labelForBooking(effectiveBookingStatus(trip, today))}`}
                  </p>
                </div>
                <SecondaryButton onClick={() => go(trip.id)}>Изменить</SecondaryButton>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * The editable half of a trip. Written out field by field so that adding one to
 * `Trip` fails to compile here rather than silently vanishing on the next save.
 */
function stripIds(trip: Trip): TripDraft {
  return {
    interestId: trip.interestId,
    slug: trip.slug,
    status: trip.status,
    title: trip.title,
    subtitle: trip.subtitle,
    startDate: trip.startDate,
    endDate: trip.endDate,
    place: trip.place,
    gallery: trip.gallery,
    coverIndex: trip.coverIndex,
    bookingStatus: trip.bookingStatus,
    totalSeats: trip.totalSeats,
    seatsLeft: trip.seatsLeft,
    goingOverride: trip.goingOverride,
    kidFriendly: trip.kidFriendly,
    kidAgeFrom: trip.kidAgeFrom,
    kidAgeTo: trip.kidAgeTo,
    showInPast: trip.showInPast,
    price: trip.price,
    placeDetails: trip.placeDetails,
    audience: trip.audience,
    whatYouGet: trip.whatYouGet,
    howToPrepare: trip.howToPrepare,
    program: trip.program,
    route: trip.route,
    map: trip.map,
    media: trip.media,
    crewPersonIds: trip.crewPersonIds,
    rules: trip.rules,
    faq: trip.faq,
    social: trip.social,
    announcementSentAt: trip.announcementSentAt,
    publishedAt: trip.publishedAt,
  };
}

function labelForBooking(status: Trip["bookingStatus"]): string {
  return {
    open: "набор открыт",
    fewSpots: "мест мало",
    soldOut: "мест нет",
    completed: "прошла",
  }[status];
}

function StatusBadge({ status }: { status: Trip["status"] }) {
  if (status === "published") return <Badge tone="live">опубликована</Badge>;
  if (status === "archived") return <Badge tone="warn">в архиве</Badge>;
  return <Badge>черновик</Badge>;
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

function describe(cause: unknown): string {
  const text = cause instanceof Error ? cause.message : String(cause);
  return /permission|insufficient/i.test(text)
    ? "База отказала в доступе. Правила Firestore ещё не опубликованы, либо этот аккаунт не внесён в список владельцев."
    : `Не удалось загрузить поездки: ${text}`;
}
