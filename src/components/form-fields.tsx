/** Dark-glass form controls shared by the AI Yacht and IT Solutions forms. */

import { pagePath, type Locale } from "@/i18n/config";

export const fieldClass =
  "w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-[color:var(--gold)] focus:bg-white/[0.09] disabled:opacity-60";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs uppercase tracking-widest text-white/60">
      {children}
    </span>
  );
}

export function Field({
  label,
  name,
  placeholder,
  required,
  textarea,
  disabled,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  textarea?: boolean;
  disabled?: boolean;
  type?: "text" | "email" | "tel" | "number";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          rows={3}
          disabled={disabled}
          className={fieldClass}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          // A number field is a sum of money here, never a dial: the spinner
          // arrows invite a click that changes an amount by one, and the
          // wheel over a focused field changes it without a click at all.
          // `step` is "any" rather than 1 on purpose: a number field refuses
          // to submit a value that does not fit its step, so with whole
          // numbers only, "1500.50" typed into a budget stopped the whole
          // form with "please enter a valid value".
          {...(type === "number"
            ? { inputMode: "decimal" as const, min: 0, step: "any" }
            : {})}
          className={`${fieldClass}${
            type === "number"
              ? " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              : ""
          }`}
        />
      )}
    </label>
  );
}

/**
 * A date, picked from the browser's own calendar.
 *
 * `type="date"` rather than a calendar written here, and that is the whole
 * point: on a phone it opens the date wheel the owner of the phone already
 * knows, it speaks their language without being told one, and it weighs
 * nothing. What it does not do is look like the rest of the form — the
 * picker button is drawn black on black in Chrome, which on a dark field is
 * invisible — so it is inverted back into view.
 *
 * `min` and `max` keep the year inside the century: an empty date field takes
 * typed digits as well as clicks, and "0005" is what a slipped keystroke
 * produces.
 */
export function DateField({
  label,
  name,
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        name={name}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert`}
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** With an empty-valued first option, this is what makes the browser
   *  refuse "Choose one…" before anything is sent. */
  required?: boolean;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <span className="relative block">
        <select
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClass} cursor-pointer appearance-none pr-11`}
        >
          {options.map((option) => (
            // Native dropdown lists ignore the translucent field background,
            // so give the options the page's navy explicitly.
            <option
              key={option.value}
              value={option.value}
              className="bg-[color:var(--primary)] text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

/** Gold tick badge + heading + text, shown in place of a form once sent. */
export function SentCard({ title, text }: { title: string; text: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[380px] flex-col items-center justify-center text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[color:var(--gold)] text-[color:var(--gold-foreground)]">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="mt-6 font-display text-2xl">{title}</h3>
      <p className="mt-3 max-w-sm text-sm text-white/75">{text}</p>
    </div>
  );
}

/**
 * The line under a form's button: what happens to what was typed, and the
 * policy that says so in full (Т-05).
 *
 * The sentence stays what each form wrote for itself — a form asking for a
 * passport photograph and one asking for an email address do not promise the
 * same thing — and the link is added here so that all four forms point at one
 * policy rather than four copies of a sentence about it.
 *
 * It is a link rather than a tick box on purpose: a box to tick in front of a
 * button that already means consent is a second click for nothing, and the
 * policy has to be readable before the button is pressed, not after.
 */
export function FormConsent({
  text,
  locale,
  className = "text-xs text-white/45",
}: {
  text: string;
  locale: Locale;
  className?: string;
}) {
  return (
    <p className={className}>
      {text}{" "}
      <a
        href={pagePath("privacy", locale)}
        className="underline decoration-white/30 underline-offset-2 transition hover:decoration-white"
      >
        {locale === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}
      </a>
      .
    </p>
  );
}

/** Gold bullet list used beside both forms. */
export function DotList({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="mt-10 space-y-3 text-sm text-white/70">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--gold)]" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}
