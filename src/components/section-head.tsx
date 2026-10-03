/**
 * The heading a section of the site opens with.
 *
 * The AI Yacht page this design comes from gave every section a small label
 * and a large headline under it. The headline was the owner's own sentence,
 * and §6.3 gives a trip's blocks a fixed heading instead — one string per
 * block, listed in Appendix В. Printed small, those strings left the page
 * without any hierarchy at all: ten sections of body text and nothing to
 * separate them.
 *
 * So the fixed string is the large headline, with the rule above it that the
 * small label used to carry. A section whose content supplies its own headline
 * — the price, the rules — keeps the small label instead; `Eyebrow` is still
 * what those use.
 */
export function SectionHead({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <div>
      <span
        aria-hidden="true"
        className={`block h-px w-10 ${
          tone === "light" ? "bg-white/40" : "bg-[color:var(--teal)]/60"
        }`}
      />
      <h2
        className={`mt-5 max-w-3xl font-display text-3xl leading-tight sm:text-5xl ${
          tone === "light" ? "text-white" : ""
        }`}
      >
        {children}
      </h2>
    </div>
  );
}
