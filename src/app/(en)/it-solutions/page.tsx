import { buildMetadata } from "@/i18n/metadata";
import { ItSolutionsPage } from "@/views/it-solutions-page";

export const metadata = buildMetadata("en", "itSolutions");

export default function Page() {
  return <ItSolutionsPage locale="en" />;
}
