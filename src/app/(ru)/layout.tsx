import "../globals.css";
import { RootDocument } from "@/components/root-document";

// Root layout for Russian: `/ru/` and `/ru/it-solutions/`.
export default function RussianLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="ru">{children}</RootDocument>;
}
