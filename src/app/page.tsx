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
import { Faq } from "@/components/faq";
import { Apply } from "@/components/apply";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <Audience />
      <Price />
      <Prep />
      <Benefits />
      <Program />
      <Route />
      <Team />
      <Format />
      <Faq />
      <Apply />
      <SiteFooter />
    </div>
  );
}
