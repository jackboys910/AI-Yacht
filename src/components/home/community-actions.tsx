import type { Locale } from "@/i18n/config";

const COPY = {
  heading: { en: "What you can do here", ru: "Что здесь можно делать" },
  joinCommunity: {
    title: { en: "Join the community", ru: "Вступить в сообщество" },
    text: {
      en: "Meet people who like what you like, and share what you are into.",
      ru: "Познакомиться с теми, кому интересно то же, и рассказать о своём.",
    },
  },
  suggest: {
    title: { en: "Suggest an idea", ru: "Предложить идею" },
    text: {
      en: "Propose a trip, an event or a project — and gather people around it.",
      ru: "Предложить поездку, событие или проект — и собрать вокруг людей.",
    },
  },
  joinTrip: {
    title: { en: "Join a trip", ru: "Поехать" },
    text: {
      en: "Find an upcoming adventure and take part in it.",
      ru: "Найти ближайшую поездку и поехать в неё.",
    },
  },
  build: {
    title: { en: "Build together", ru: "Создавать вместе" },
    text: {
      en: "Turn an idea into a working product with the people who build ours.",
      ru: "Превратить идею в рабочий продукт вместе с теми, кто сделал этот сайт.",
    },
  },
} as const;

/** One of the four ways in. */
interface Action {
  id: string;
  title: string;
  text: string;
  href?: string;
  icon: "people" | "idea" | "compass" | "code";
}

/**
 * The four calls to action under the S (ТЗ v4, §4.2) — what a visitor can
 * actually do on this site, said in four lines.
 *
 * Only the ones that lead somewhere are drawn. "Join the community" waits for
 * the About page (item 2.2) and "Suggest an idea" for the submission form
 * (item 2.5); until then they are absent rather than present and dead, which
 * is the same rule the header's "+ Subscribe" follows.
 */
export function CommunityActions({
  locale,
  solutionsHref,
  aboutHref,
  suggestHref,
}: {
  locale: Locale;
  solutionsHref: string;
  /** Arrives with item 2.2. */
  aboutHref?: string;
  /** Arrives with item 2.5. */
  suggestHref?: string;
}) {
  const actions: Action[] = [
    {
      id: "community",
      title: COPY.joinCommunity.title[locale],
      text: COPY.joinCommunity.text[locale],
      href: aboutHref,
      icon: "people",
    },
    {
      id: "suggest",
      title: COPY.suggest.title[locale],
      text: COPY.suggest.text[locale],
      href: suggestHref,
      icon: "idea",
    },
    {
      id: "trip",
      title: COPY.joinTrip.title[locale],
      text: COPY.joinTrip.text[locale],
      href: "#upcoming",
      icon: "compass",
    },
    {
      id: "build",
      title: COPY.build.title[locale],
      text: COPY.build.text[locale],
      href: solutionsHref,
      icon: "code",
    },
  ];

  const shown = actions.filter((action) => action.href);
  if (shown.length === 0) return null;

  return (
    <section className="border-t border-white/10 bg-primary py-12 text-white sm:py-16">
      <div className="container-narrow">
        <h2 className="text-center text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-xs">
          {COPY.heading[locale]}
        </h2>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((action) => (
            <a
              key={action.id}
              href={action.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[color:var(--gold)]/60 hover:bg-white/[0.08]"
            >
              <Icon name={action.icon} />
              <h3 className="mt-3 font-display text-lg leading-tight">{action.title}</h3>
              <p className="mt-1.5 text-sm leading-snug text-white/65">{action.text}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Icon({ name }: { name: Action["icon"] }) {
  const paths: Record<Action["icon"], string> = {
    people: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8m13 16v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    idea: "M9 21h6M10 18h4m-2-15a6 6 0 0 1 4 10.47V17H8v-3.53A6 6 0 0 1 12 3Z",
    compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm3.5-13.5-2 5-5 2 2-5 5-2Z",
    code: "M8 18l-6-6 6-6m8 0 6 6-6 6",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 text-[color:var(--gold)] transition group-hover:scale-110"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
