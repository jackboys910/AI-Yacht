/** Dark-glass form controls shared by the AI Yacht and IT Solutions forms. */

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
  type?: "text" | "email" | "tel";
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
          className={fieldClass}
        />
      )}
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
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <span className="relative block">
        <select
          name={name}
          value={value}
          disabled={disabled}
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
