"use client";

import { createContext, useContext, type ReactNode } from "react";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import type { Localized } from "@/lib/content/types";

/**
 * The form controls every admin screen is built from.
 *
 * The piece that matters is how two languages are handled. §7.2 asks for EN and
 * RU tabs on each text field; a tab strip repeated above forty fields would be
 * unusable on the trip form, so the switch is made once per form and every
 * localized field follows it — the same two tabs, shared.
 *
 * What a per-field tab strip would have shown at a glance is shown instead
 * under each input: the other language's current text, greyed, or a warning
 * that it is empty. That is strictly more information than a tab, because a
 * gap is visible without switching to find it — and gaps are what blocks
 * publication under А-03.
 */

const FormLocaleContext = createContext<Locale>("en");

export const useFormLocale = () => useContext(FormLocaleContext);

export function FormLocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <FormLocaleContext.Provider value={locale}>{children}</FormLocaleContext.Provider>
  );
}

/** The one language switch per form. A dot marks a language with empty fields. */
export function LocaleTabs({
  value,
  onChange,
  incomplete = [],
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
  incomplete?: Locale[];
}) {
  return (
    <div
      role="group"
      aria-label="Язык содержимого"
      className="inline-flex h-9 items-stretch rounded-full border border-border p-[3px] text-xs font-semibold tracking-[0.08em]"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          aria-pressed={locale === value}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 leading-none transition ${
            locale === value
              ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {localeLabels[locale]}
          {incomplete.includes(locale) && (
            <span
              aria-label="есть незаполненные поля"
              className="h-1.5 w-1.5 rounded-full bg-amber-500"
            />
          )}
        </button>
      ))}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/25 disabled:opacity-60";

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {children}
      {required && <span className="ml-1 text-[color:var(--teal)]">*</span>}
    </label>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">{children}</p>;
}

/** What the field says in the language the form is not currently showing. */
function OtherLocale({ locale, value }: { locale: Locale; value: string }) {
  const filled = value.trim().length > 0;
  return (
    <p
      className={`mt-1 truncate text-xs ${
        filled ? "text-muted-foreground" : "text-amber-600"
      }`}
      title={filled ? value : undefined}
    >
      <span className="font-semibold">{localeLabels[locale]}:</span>{" "}
      {filled ? value : "не заполнено"}
    </p>
  );
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  required,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "url" | "number";
}) {
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 ${inputClass}`}
      />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function LocalizedInput({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: Localized<string>;
  onChange: (value: Localized<string>) => void;
  hint?: ReactNode;
  placeholder?: string;
  required?: boolean;
}) {
  const locale = useFormLocale();
  const other = locales.find((l) => l !== locale)!;

  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        type="text"
        lang={locale}
        value={value[locale]}
        placeholder={placeholder}
        onChange={(event) => onChange({ ...value, [locale]: event.target.value })}
        className={`mt-1.5 ${inputClass}`}
      />
      <OtherLocale locale={other} value={value[other]} />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function LocalizedTextarea({
  id,
  label,
  value,
  onChange,
  hint,
  rows = 4,
  required,
}: {
  id: string;
  label: string;
  value: Localized<string>;
  onChange: (value: Localized<string>) => void;
  hint?: ReactNode;
  rows?: number;
  required?: boolean;
}) {
  const locale = useFormLocale();
  const other = locales.find((l) => l !== locale)!;

  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        lang={locale}
        value={value[locale]}
        onChange={(event) => onChange({ ...value, [locale]: event.target.value })}
        className={`mt-1.5 ${inputClass} resize-y`}
      />
      <OtherLocale locale={other} value={value[other]} />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

/**
 * A bullet list, edited as one item per line.
 *
 * "What's included", the paragraphs of "The place", the points of "Is this trip
 * for you?" are all short lists, and a textarea is far quicker to fill and to
 * reorder than a stack of single-line inputs with buttons beside each — on a
 * phone especially. Blank lines are dropped, so a stray newline costs nothing.
 *
 * The two languages are independent lists: a translation may legitimately need
 * a different number of lines.
 */
export function LocalizedLines({
  id,
  label,
  value,
  onChange,
  hint,
  rows = 5,
  placeholder,
}: {
  id: string;
  label: string;
  value: Localized<string[]>;
  onChange: (value: Localized<string[]>) => void;
  hint?: ReactNode;
  rows?: number;
  placeholder?: string;
}) {
  const locale = useFormLocale();
  const other = locales.find((l) => l !== locale)!;
  const otherCount = value[other].filter((line) => line.trim()).length;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={rows}
        lang={locale}
        placeholder={placeholder}
        value={value[locale].join("\n")}
        onChange={(event) =>
          onChange({
            ...value,
            [locale]: event.target.value.split("\n").filter((line) => line.trim()),
          })
        }
        className={`mt-1.5 ${inputClass} resize-y`}
      />
      <p className={`mt-1 text-xs ${otherCount ? "text-muted-foreground" : "text-amber-600"}`}>
        <span className="font-semibold">{localeLabels[other]}:</span>{" "}
        {otherCount ? `${otherCount} стр.` : "не заполнено"}
      </p>
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  hint,
  min = 0,
  required,
}: {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  hint?: ReactNode;
  min?: number;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        id={id}
        type="number"
        min={min}
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "" ? undefined : Number(raw));
        }}
        className={`mt-1.5 ${inputClass}`}
      />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function Select<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  hint,
  required,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={`mt-1.5 ${inputClass}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[color:var(--teal)]"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && <Hint>{hint}</Hint>}
      </div>
    </div>
  );
}

/** A list of problems that stops a save, or one that stops a publish. */
export function Problems({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center rounded-full bg-[color:var(--gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  disabled,
  onClick,
  tone = "normal",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "normal" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
        tone === "danger"
          ? "border-red-300 text-red-700 hover:border-red-500"
          : "border-border text-foreground hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}
