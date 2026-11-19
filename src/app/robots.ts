import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/**
 * `robots.txt` (Т-03).
 *
 * Two paths are closed, and for different reasons. `/admin/` is the panel —
 * nothing there is public, and an indexed sign-in form is only ever a target.
 * `/unsubscribe/` is a page about one person's subscription, reached by a key
 * in a letter; a crawler that followed such a key out of a forwarded letter
 * would be the one visitor that page must not have. The pages themselves also
 * say `noindex`, because robots.txt is a request and the meta tag is the
 * instruction.
 *
 * Everything else is open on purpose: the point of the site is to be found.
 *
 * `force-static` is required rather than decorative: a metadata route is a
 * route handler, and `output: "export"` refuses to build one that has not
 * said it is printed at build time.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/unsubscribe/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
