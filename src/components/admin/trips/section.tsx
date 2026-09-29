"use client";

import type { ReactNode } from "react";

/** One block of the trip form, with an anchor the table of contents jumps to. */
export function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-display text-lg">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

/**
 * A block §6.3 marks as optional.
 *
 * Absent means the owner did not fill it in, and the page then does not render
 * it at all — no empty heading, no placeholder. So the form models it the same
 * way: the block is either added or it does not exist, rather than sitting
 * there empty and shipping a hole in the page.
 */
export function OptionalSection<T>({
  id,
  title,
  subtitle,
  value,
  onChange,
  create,
  children,
}: {
  id: string;
  title: string;
  subtitle?: ReactNode;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  create: () => T;
  children: (value: T, update: (next: T) => void) => ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <button
          type="button"
          onClick={() => onChange(value === undefined ? create() : undefined)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            value === undefined
              ? "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              : "border-border text-red-600 hover:border-red-400"
          }`}
        >
          {value === undefined ? "+ Добавить блок" : "Убрать блок"}
        </button>
      </div>

      {value === undefined ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Блока нет — на странице поездки он не появится.
        </p>
      ) : (
        <div className="mt-5 space-y-5">{children(value, onChange)}</div>
      )}
    </section>
  );
}
