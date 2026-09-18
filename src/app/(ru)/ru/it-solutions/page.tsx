import { buildMetadata } from "@/i18n/metadata";
import { ItSolutionsPage } from "@/views/it-solutions-page";

export const metadata = buildMetadata("ru", "itSolutions");

export default function Page() {
  return <ItSolutionsPage locale="ru" />;
}
