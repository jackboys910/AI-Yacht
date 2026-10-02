"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { rebuildSoon } from "@/lib/rebuild";
import type { Interest } from "@/lib/content/types";
import {
  blankInterest,
  listInterests,
  saveInterest,
  type InterestDraft,
} from "@/lib/firebase/interests";
import { PrimaryButton, SecondaryButton } from "../fields";
import { InterestForm } from "./interest-form";

/**
 * §7.3: the list of tabs, and adding one without a developer (А-14).
 *
 * Which screen is showing travels in the address (`?view=interests&edit=…`)
 * rather than in component state, so a reload keeps the owner where they were
 * and the browser's Back button steps out of the form the way it should.
 */
export function InterestsView() {
  const router = useRouter();
  const params = useSearchParams();
  const editing = params.get("edit");

  const [interests, setInterests] = useState<Interest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  // State is only ever set from the promise's continuation, never in the effect
  // body: a synchronous set there cascades a second render before the first has
  // painted. `active` covers the owner navigating away mid-request.
  useEffect(() => {
    let active = true;

    listInterests().then(
      (loaded) => {
        if (!active) return;
        setInterests(loaded);
        setError(null);
      },
      (cause: unknown) => {
        if (!active) return;
        setInterests([]);
        setError(describe(cause));
      },
    );

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const go = (edit: string | null) =>
    router.push(`/admin/?view=interests${edit ? `&edit=${edit}` : ""}`);

  if (interests === null) {
    return <p className="text-sm text-muted-foreground">Загружаем направления…</p>;
  }

  if (editing) {
    const current = editing === "new" ? null : interests.find((i) => i.id === editing);
    if (editing !== "new" && !current) {
      return (
        <Empty
          title="Направление не найдено"
          action={<PrimaryButton onClick={() => go(null)}>К списку</PrimaryButton>}
        />
      );
    }

    const nextOrder = interests.reduce((max, i) => Math.max(max, i.order), 0) + 1;
    const initial: InterestDraft = current
      ? stripIds(current)
      : blankInterest(nextOrder);

    return (
      <InterestForm
        id={current?.id ?? null}
        initial={initial}
        others={interests.filter((i) => i.id !== current?.id)}
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
      {error && <Banner>{error}</Banner>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {interests.length === 0
            ? "Пока ни одного направления."
            : `Направлений: ${interests.length}. Порядок здесь — порядок в меню сайта.`}
        </p>
        <PrimaryButton onClick={() => go("new")}>Новое направление</PrimaryButton>
      </div>

      {interests.length > 0 && (
        <ul className="mt-6 space-y-3">
          {interests.map((interest, index) => (
            <li
              key={interest.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{interest.name.en || interest.slug}</span>
                  <code className="rounded bg-[color:var(--muted)] px-1.5 py-0.5 text-xs text-muted-foreground">
                    /{interest.slug}/
                  </code>
                  {interest.hidden && <Badge tone="warn">скрыто с сайта</Badge>}
                  {!interest.showPastTrips && <Badge>без прошедших</Badge>}
                  {interest.collectsKidFriendly && <Badge>собирает поездки с детьми</Badge>}
                </div>
                {interest.description.en && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {interest.description.en}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Move
                  label="Выше"
                  disabled={index === 0}
                  onClick={() => void swap(interests, index, index - 1, reload)}
                >
                  ↑
                </Move>
                <Move
                  label="Ниже"
                  disabled={index === interests.length - 1}
                  onClick={() => void swap(interests, index, index + 1, reload)}
                >
                  ↓
                </Move>
              </div>

              <SecondaryButton onClick={() => go(interest.id)}>Изменить</SecondaryButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Reordering swaps the two `order` values rather than renumbering the list, so
 * one move is two writes whatever the list's length.
 */
async function swap(
  interests: Interest[],
  from: number,
  to: number,
  reload: () => void,
) {
  const a = interests[from];
  const b = interests[to];
  await Promise.all([
    saveInterest(a.id, { ...stripIds(a), order: b.order }),
    saveInterest(b.id, { ...stripIds(b), order: a.order }),
  ]);
  // The order decides where the tab sits in the header and among the tiles.
  rebuildSoon();
  reload();
}

/**
 * The editable half of an interest, without the fields the database owns.
 *
 * Written out field by field rather than by dropping keys: adding a field to
 * `Interest` then fails to compile here until it is either carried into the
 * form or deliberately left out, instead of silently vanishing on the next save.
 */
function stripIds(interest: Interest): InterestDraft {
  return {
    slug: interest.slug,
    name: interest.name,
    description: interest.description,
    tileCaption: interest.tileCaption,
    cover: interest.cover,
    order: interest.order,
    youtubePlaylistId: interest.youtubePlaylistId,
    showPastTrips: interest.showPastTrips,
    hidden: interest.hidden,
    collectsKidFriendly: interest.collectsKidFriendly,
  };
}

function Move({
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
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border text-base transition hover:border-foreground disabled:opacity-30"
    >
      {children}
    </button>
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

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      {children}
    </div>
  );
}

function Empty({ title, action }: { title: string; action: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}

function describe(cause: unknown): string {
  const text = cause instanceof Error ? cause.message : String(cause);
  return /permission|insufficient/i.test(text)
    ? "База отказала в доступе. Правила Firestore ещё не опубликованы, либо этот аккаунт не внесён в список владельцев."
    : `Не удалось загрузить направления: ${text}`;
}
