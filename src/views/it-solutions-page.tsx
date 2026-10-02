import { getDictionary, pagePath, type Locale } from "@/i18n";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import type { SiteChrome } from "./trip-page";
import { ItHero } from "@/components/it/it-hero";
import { ItAbout, ItPrinciples } from "@/components/it/it-about";
import { ItCases } from "@/components/it/it-cases";
import { ItServices } from "@/components/it/it-services";
import { ItProcess } from "@/components/it/it-process";
import { ItYachtPromo } from "@/components/it/it-yacht-promo";
import { ItFaq } from "@/components/it/it-faq";
import { ItInquiryForm } from "@/components/it/it-inquiry-form";

/**
 * The Solutions page (§6.6). Its own content is rewritten in plan item 3.3;
 * what changed with item 1.11 is the furniture around it — the page used to
 * carry the AI Yacht landing's header, whose menu pointed at anchors that
 * landing no longer has. It now wears the same header and footer as the rest
 * of the site, built from the interests in the database.
 */
export function ItSolutionsPage({
  locale,
  chrome,
}: {
  locale: Locale;
  chrome: SiteChrome;
}) {
  const t = getDictionary(locale);
  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        languageHrefs={chrome.languageHrefs}
        active="solutions"
      />
      <ItHero t={t.it.hero} />
      <ItAbout t={t.it.about} />
      <ItPrinciples t={t.it.about} />
      <ItCases t={t.it.cases} />
      <ItServices t={t.it.services} />
      <ItProcess t={t.it.process} />
      <ItYachtPromo t={t.it.yachtPromo} homeHref={pagePath("home", locale)} />
      <ItFaq t={t.it.faq} cta={t.it.hero.ctaPrimary} />
      <ItInquiryForm
        locale={locale}
        t={t.it.form}
        services={t.it.services.items}
      />
      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
