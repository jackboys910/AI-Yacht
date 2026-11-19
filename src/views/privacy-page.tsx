import { privacyCopy, PRIVACY_UPDATED } from "@/components/privacy/privacy-copy";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import type { Locale } from "@/i18n/config";
import { emailConfig } from "@/lib/email/config";
import type { SiteChrome } from "./trip-page";

/**
 * `/privacy/` — the Privacy Policy on both languages (§6.7, Т-06).
 *
 * Plain and readable on purpose: this is the page somebody opens because the
 * cookie banner sent them there, and a wall of defined terms would answer
 * none of the three questions they actually have — what do you know about me,
 * who else sees it, how do I stop it.
 *
 * The postal address comes from the settings, the same field the letters use
 * (§7.7, CAN-SPAM). While it is empty the block is simply absent rather than
 * printing a placeholder: an address nobody can write to is worse than the
 * email address above it.
 */
export function PrivacyPage({
  locale,
  chrome,
  postalAddress,
}: {
  locale: Locale;
  chrome: SiteChrome;
  /** Settings → The site → Sender's postal address. Empty hides the line. */
  postalAddress?: string;
}) {
  const c = privacyCopy;
  const address = postalAddress?.trim();

  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />

      <section className="bg-primary pb-14 pt-28 text-white sm:pb-20 sm:pt-36">
        <div className="container-narrow max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--gold)] sm:text-xs">
            {c.eyebrow[locale]}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
            {c.title[locale]}
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-white/75">{c.lead[locale]}</p>
          <p className="mt-6 text-xs text-white/50">
            {c.updated[locale]}: {PRIVACY_UPDATED}
          </p>
        </div>
      </section>

      <section className="bg-background py-14 sm:py-20">
        <div className="container-narrow max-w-3xl">
          {c.sections.map((section) => (
            <div key={section.title.en} className="mt-10 first:mt-0">
              <h2 className="font-display text-2xl">{section.title[locale]}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-3 leading-relaxed text-muted-foreground"
                >
                  {paragraph[locale]}
                </p>
              ))}
              {"list" in section && section.list && (
                <ul className="mt-4 space-y-3">
                  {section.list.map((item, index) => (
                    <li key={index} className="flex gap-3 leading-relaxed text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--gold)]" />
                      <span>
                        <Emphasised text={item[locale]} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl">{c.contactTitle[locale]}</h2>
            <p className="mt-3 text-muted-foreground">{c.contactLead[locale]}</p>
            <p className="mt-2">
              <a
                href={`mailto:${emailConfig.recipient}`}
                className="font-medium text-[color:var(--teal)] underline underline-offset-4"
              >
                {emailConfig.recipient}
              </a>
            </p>
            {address && (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="block text-[10px] uppercase tracking-[0.18em]">
                  {c.postalLabel[locale]}
                </span>
                <span className="mt-1 block whitespace-pre-line">{address}</span>
              </p>
            )}
            <p className="mt-5">
              <a
                href={locale === "en" ? "/unsubscribe/" : `/${locale}/unsubscribe/`}
                className="text-sm text-[color:var(--teal)] underline underline-offset-4"
              >
                {c.unsubscribeLink[locale]}
              </a>
            </p>
          </div>
        </div>
      </section>

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}

/**
 * `**bold**` in the copy, and nothing else.
 *
 * The list items name what the site does — "Subscribing", "Applying to a
 * trip" — and the name of the thing has to stand out from the sentence about
 * it. One asterisk pair is cheaper than splitting every item into two fields
 * nobody would keep in step.
 */
function Emphasised({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
