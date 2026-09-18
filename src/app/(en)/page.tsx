import { buildMetadata } from "@/i18n/metadata";
import { HomePage } from "@/views/home-page";

export const metadata = buildMetadata("en", "home");

export default function Page() {
  return <HomePage locale="en" />;
}
