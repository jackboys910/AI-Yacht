import { getDictionary, pagePath, type Locale } from "@/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ItHero } from "@/components/it/it-hero";
import { ItAbout, ItPrinciples } from "@/components/it/it-about";
import { ItCases } from "@/components/it/it-cases";
import { ItServices } from "@/components/it/it-services";
import { ItProcess } from "@/components/it/it-process";
import { ItYachtPromo } from "@/components/it/it-yacht-promo";
import { ItFaq } from "@/components/it/it-faq";
import { ItInquiryForm } from "@/components/it/it-inquiry-form";

export function ItSolutionsPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <div className="bg-background text-foreground">
      <SiteHeader locale={locale} page="itSolutions" t={t.header} />
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
      <SiteFooter locale={locale} t={t.footer} />
    </div>
  );
}
