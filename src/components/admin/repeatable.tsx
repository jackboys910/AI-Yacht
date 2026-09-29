"use client";

import type { ReactNode } from "react";

/**
 * A block the owner can have any number of: route days, FAQ pairs, programme
 * stages, "what you get" cards.
 *
 * Reordering is arrows rather than drag-and-drop. §7.8 wants the whole trip
 * built from a phone, and dragging a card up a long scrolling form with a thumb
 * is the kind of interaction that works in a demo and fails in real use.
 */
export function Repeatable<T>({
  items,
  onChange,
  create,
  render,
  addLabel,
  itemLabel,
  max,
  empty,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (next: T) => void, index: number) => ReactNode;
  addLabel: string;
  /** Heading for one entry, e.g. "День" → "День 1". */
  itemLabel: (index: number, item: T) => string;
  max?: number;
  empty?: string;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  const update = (index: number, value: T) =>
    onChange(items.map((item, i) => (i === index ? value : item)));

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {items.length === 0 && empty && (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-[color:var(--muted)]/40 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{itemLabel(index, item)}</span>
            <div className="flex items-center gap-1">
              <IconButton
                label="Выше"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </IconButton>
              <IconButton
                label="Ниже"
                disabled={index === items.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </IconButton>
              <IconButton label="Убрать" onClick={() => remove(index)} tone="danger">
                ✕
              </IconButton>
            </div>
          </div>
          <div className="space-y-4">{render(item, (next) => update(index, next), index)}</div>
        </div>
      ))}

      {(max === undefined || items.length < max) && (
        <button
          type="button"
          onClick={() => onChange([...items, create()])}
          className="rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground"
        >
          + {addLabel}
        </button>
      )}

      {max !== undefined && items.length >= max && (
        <p className="text-xs text-muted-foreground">Больше {max} добавить нельзя.</p>
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  disabled,
  onClick,
  tone = "normal",
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  tone?: "normal" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg border text-sm transition disabled:opacity-30 ${
        tone === "danger"
          ? "border-border text-red-600 hover:border-red-400"
          : "border-border hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}
