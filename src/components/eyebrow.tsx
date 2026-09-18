/** Small uppercase section label with a leading rule. */
export function Eyebrow({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] ${
        tone === "light" ? "text-white/70" : "text-[color:var(--teal)]"
      }`}
    >
      <span
        className={`h-px w-8 ${
          tone === "light" ? "bg-white/40" : "bg-[color:var(--teal)]/60"
        }`}
      />
      {children}
    </span>
  );
}
