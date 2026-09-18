"use client";

/** Fired by a service card; the inquiry form listens and preselects it. */
export const SELECT_SERVICE_EVENT = "it:select-service";

export function QuoteLink({
  service,
  children,
}: {
  service: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href="#it-apply"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent(SELECT_SERVICE_EVENT, { detail: service }),
        )
      }
      className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-[color:var(--teal)] transition hover:gap-3"
    >
      {children}
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
