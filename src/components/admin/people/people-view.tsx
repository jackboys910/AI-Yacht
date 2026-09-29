"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Person } from "@/lib/content/types";
import { blankPerson, listPeople, type PersonDraft } from "@/lib/firebase/people";
import { PrimaryButton, SecondaryButton } from "../fields";
import { PersonForm } from "./person-form";

/**
 * §7.4: the crew directory. Which screen is showing travels in the address
 * (`?view=people&edit=…`), so a reload keeps the owner where they were.
 */
export function PeopleView() {
  const router = useRouter();
  const params = useSearchParams();
  const editing = params.get("edit");

  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  // State is only set from the promise's continuation, never in the effect
  // body; `active` covers the owner navigating away mid-request.
  useEffect(() => {
    let active = true;

    listPeople().then(
      (loaded) => {
        if (!active) return;
        setPeople(loaded);
        setError(null);
      },
      (cause: unknown) => {
        if (!active) return;
        setPeople([]);
        setError(describe(cause));
      },
    );

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const go = (edit: string | null) =>
    router.push(`/admin/?view=people${edit ? `&edit=${edit}` : ""}`);

  if (people === null) {
    return <p className="text-sm text-muted-foreground">Загружаем справочник…</p>;
  }

  if (editing) {
    const current = editing === "new" ? null : people.find((p) => p.id === editing);
    if (editing !== "new" && !current) {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Человек не найден.</p>
          <div className="mt-4">
            <PrimaryButton onClick={() => go(null)}>К списку</PrimaryButton>
          </div>
        </div>
      );
    }

    const initial: PersonDraft = current ? stripIds(current) : blankPerson();

    return (
      <PersonForm
        id={current?.id ?? null}
        initial={initial}
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
          {people.length === 0
            ? "Пока никого. Людей из справочника можно добавлять в любые поездки, не вводя заново."
            : `Людей: ${people.length}. Их можно добавлять в любые поездки, не вводя заново.`}
        </p>
        <PrimaryButton onClick={() => go("new")}>Новый человек</PrimaryButton>
      </div>

      {people.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              {person.photo?.url ? (
                <img
                  src={person.photo.url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[color:var(--muted)] text-sm text-muted-foreground">
                  {initials(person.name.en || person.name.ru)}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {person.name.en || person.name.ru || "Без имени"}
                </p>
                {person.role.en && (
                  <p className="truncate text-sm text-muted-foreground">{person.role.en}</p>
                )}
              </div>

              <SecondaryButton onClick={() => go(person.id)}>Изменить</SecondaryButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The editable half of a person. Written out field by field so that adding one
 * to `Person` fails to compile here rather than silently vanishing on save.
 */
function stripIds(person: Person): PersonDraft {
  return {
    name: person.name,
    role: person.role,
    bio: person.bio,
    photo: person.photo,
  };
}

/** Stand-in for a missing photo, and the same shape the avatars use (§6.3). */
function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "—"
  );
}

function describe(cause: unknown): string {
  const text = cause instanceof Error ? cause.message : String(cause);
  return /permission|insufficient/i.test(text)
    ? "База отказала в доступе. Правила Firestore ещё не опубликованы, либо этот аккаунт не внесён в список владельцев."
    : `Не удалось загрузить справочник: ${text}`;
}
