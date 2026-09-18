import "../globals.css";
import { RootDocument } from "@/components/root-document";

// Root layout for the default (English) locale: `/` and `/it-solutions/`.
export default function EnglishLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
