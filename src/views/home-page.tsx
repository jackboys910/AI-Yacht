import { getDictionary, pagePath, type Locale } from "@/i18n";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Audience } from "@/components/audience";
import { Price } from "@/components/price";
import { Prep } from "@/components/prep";
import { Benefits } from "@/components/benefits";
import { Program } from "@/components/program";
import { Route } from "@/components/route";
import { Team } from "@/components/team";
import { Format } from "@/components/format";
import { ItTeaser } from "@/components/it-teaser";
import { Faq } from "@/components/faq";
import { Apply } from "@/components/apply";
import { SiteFooter } from "@/components/site-footer";

export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <div className="bg-background text-foreground">
      <SiteHeader locale={locale} page="home" t={t.header} />
      <Hero t={t.home.hero} />
      <Audience t={t.home.audience} />
      <Price t={t.home.price} />
      <Prep t={t.home.prep} />
      <Benefits t={t.home.benefits} />
      <Program t={t.home.program} />
      <Route t={t.home.route} />
      <Team t={t.home.team} />
      <Format t={t.home.format} />
      <ItTeaser t={t.home.itTeaser} href={pagePath("itSolutions", locale)} />
      <Faq t={t.home.faq} />
      <Apply locale={locale} t={t.home.apply} />
      <SiteFooter locale={locale} t={t.footer} />
    </div>
  );
}
