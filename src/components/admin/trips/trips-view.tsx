"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { effectiveBookingStatus, isPast, todayUtc } from "@/lib/content/schedule";
import type { Interest, Person, Trip } from "@/lib/content/types";
import { listInterests } from "@/lib/firebase/interests";
import { listPeople } from "@/lib/firebase/people";
import {
  blankTrip,
  duplicateTrip,
  listTrips,
  setTripStatus,
  stripTripIds,
  type TripDraft,
} from "@/lib/firebase/trips";
import { PrimaryButton, SecondaryButton } from "../fields";
import { TripForm } from "./trip-form";

/**
 * §7.2: the list of trips, its filters, and the actions that move a trip
 * between draft, published and the archive (А-10, А-11, А-13).
 */

type StatusFilter = "all" | "draft" | "published" | "past" | "archived";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "published", label: "Опубликованные" },
  { value: "past", label: "Прошедшие" },
  { value: "archived", label: "Архив" },
];

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
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [interestId, setInterestId] = useState("all");
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
      setError(describe(cause));
    } finally {
      setBusyId(null);
    }
  }

  if (data === null) {
    return <p className="text-sm text-muted-foreground">Загружаем поездки…</p>;
  }

  const { trips, interests, people } = data;

  if (editing) {
    const current = editing === "new" ? null : trips.find((t) => t.id === editing);
    if (editing !== "new" && !current) {
      return (
        <Empty text="Поездка не найдена.">
          <PrimaryButton onClick={() => go(null)}>К списку</PrimaryButton>
        </Empty>
      );
    }

    if (interests.length === 0) {
      return (
        <Empty text="Сначала заведите хотя бы одно направление — поездка должна куда-то попасть.">
          <PrimaryButton onClick={() => router.push("/admin/?view=interests&edit=new")}>
            К направлениям
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

  return (
    <div>
      {error && <Banner tone="warn">{error}</Banner>}
      {notice && <Banner tone="info">{notice}</Banner>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Filter
            id="filter-status"
            label="Статус"
            value={status}
            options={STATUS_FILTERS}
            onChange={(value) => setStatus(value as StatusFilter)}
          />
          <Filter
            id="filter-interest"
            label="Направление"
            value={interestId}
            options={[
              { value: "all", label: "Все" },
              ...interests.map((interest) => ({
                value: interest.id,
                label: interest.name.en || interest.slug,
              })),
            ]}
            onChange={setInterestId}
          />
        </div>
        <PrimaryButton onClick={() => go("new")}>Новая поездка</PrimaryButton>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {trips.length === 0
          ? "Поездок пока нет."
          : `Показано ${visible.length} из ${trips.length}.`}
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
                      {trip.title.en || trip.title.ru || "Без названия"}
                    </span>
                    <StatusBadge status={trip.status} past={past} />
                    {trip.kidFriendly && <Badge>с детьми</Badge>}
                    {past && !trip.showInPast && <Badge tone="warn">скрыта в прошедших</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {interest?.name.en ?? "направление не задано"} · {trip.startDate} — {trip.endDate}
                    {trip.status === "published" &&
                      ` · ${labelForBooking(effectiveBookingStatus(trip, today))}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SecondaryButton onClick={() => go(trip.id)} disabled={busy}>
                    Изменить
                  </SecondaryButton>

                  <SecondaryButton
                    disabled={busy}
                    onClick={() =>
                      void act(trip, async () => {
                        await duplicateTrip(trip, trips);
                        return "Копия создана как черновик. Фотографии у копии те же — файлы общие с оригиналом.";
                      })
                    }
                  >
                    {busy ? "…" : "Дублировать"}
                  </SecondaryButton>

                  {trip.status === "archived" ? (
                    <SecondaryButton
                      disabled={busy}
                      onClick={() =>
                        void act(trip, async () => {
                          await setTripStatus(trip, "restore");
                          return trip.statusBeforeArchive === "published"
                            ? "Поездка вернулась на сайт."
                            : "Поездка вернулась в черновики.";
                        })
                      }
                    >
                      Вернуть
                    </SecondaryButton>
                  ) : (
                    <SecondaryButton
                      disabled={busy}
                      onClick={() =>
                        void act(trip, async () => {
                          await setTripStatus(trip, "archived");
                          return "Поездка убрана с сайта в архив.";
                        })
                      }
                    >
                      В архив
                    </SecondaryButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {trips.length > 0 && visible.length === 0 && (
        <Empty text="По этому фильтру поездок нет.">
          <SecondaryButton
            onClick={() => {
              setStatus("all");
              setInterestId("all");
            }}
          >
            Показать все
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

function labelForBooking(status: Trip["bookingStatus"]): string {
  return {
    open: "набор открыт",
    fewSpots: "мест мало",
    soldOut: "мест нет",
    completed: "прошла",
  }[status];
}

function StatusBadge({ status, past }: { status: Trip["status"]; past: boolean }) {
  if (status === "archived") return <Badge tone="warn">в архиве</Badge>;
  if (status === "published") {
    return past ? <Badge>прошедшая</Badge> : <Badge tone="live">опубликована</Badge>;
  }
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

function describe(cause: unknown): string {
  const text = cause instanceof Error ? cause.message : String(cause);
  return /permission|insufficient/i.test(text)
    ? "База отказала в доступе. Правила Firestore ещё не опубликованы, либо этот аккаунт не внесён в список владельцев."
    : `Не удалось загрузить поездки: ${text}`;
}
