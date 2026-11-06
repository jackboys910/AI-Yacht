import {
  AboutClosing,
  AboutFree,
  AboutHero,
  AboutIdea,
  AboutLetter,
  AboutRoles,
  AboutSteps,
  AboutTerms,
  AboutValues,
} from "@/components/about/about-sections";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import type { Locale } from "@/i18n/config";
import type { SiteChrome } from "./trip-page";

/**
 * The About page (ТЗ v4, §5) — what this community is, who can do what in it,
 * and what taking part commits you to.
 *
 * It is not the Story page. §2 of ТЗ v3 renamed "Обо мне" to `/story/`, which
 * is the owner's own history, his channel and his links; that one arrives with
 * item 4.1. This page is about the community rather than the person, which is
 * why the two live apart instead of fighting over one address.
 */
export function AboutPage({
  locale,
  chrome,
  tripsHref,
}: {
  locale: Locale;
  chrome: SiteChrome;
  /** Back to the home page's "Upcoming trips" block. */
  tripsHref: string;
}) {
  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
        active="about"
      />

      <AboutHero locale={locale} />
      <AboutLetter locale={locale} />
      <AboutIdea locale={locale} />
      <AboutRoles locale={locale} />
      <AboutSteps locale={locale} />
      <AboutFree locale={locale} />
      <AboutValues locale={locale} />
      <AboutTerms locale={locale} />
      <AboutClosing locale={locale} tripsHref={tripsHref} />

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
