import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import {
  defaultLocale,
  locales,
  ogLocales,
  pagePath,
  type Locale,
  type PageId,
} from "./config";
import { getDictionary } from "./index";

const ogImages: Record<PageId, string> = {
  home: "/assets/hero-catamaran.jpg",
  itSolutions: "/assets/laptop-deck.jpg",
};

/** Title, description, Open Graph and hreflang alternates for one page. */
export function buildMetadata(locale: Locale, page: PageId): Metadata {
  const { title, description } = getDictionary(locale).meta[page];
  const url = pagePath(page, locale);

  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, pagePath(page, l)]),
  );
  languages["x-default"] = pagePath(page, defaultLocale);

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    authors: [{ name: siteConfig.name }],
    icons: { icon: "/favicon.ico" },
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      locale: ogLocales[locale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => ogLocales[l]),
      images: [ogImages[page]],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImages[page]],
    },
  };
}
