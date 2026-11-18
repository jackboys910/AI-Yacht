import { siteConfig } from "../site";

/**
 * The two links every mailing carries (Н-09, §8.3).
 *
 * In one file because three places have to agree on them: the Worker that
 * puts them into a letter, the page that answers them (plan item 3.3), and
 * the tests. A link in a letter that has already been sent cannot be
 * corrected afterwards, so the shape is fixed here once.
 *
 * The key, not the address, is what identifies the subscriber. An address in
 * the query string would let anyone unsubscribe anyone by typing a guess;
 * `manageKey` is 256 random bits, written on every subscriber since the
 * subscription form first existed.
 */

const PATH = "unsubscribe";

const base = (locale: "en" | "ru") =>
  locale === "ru" ? `${siteConfig.url}/ru/${PATH}/` : `${siteConfig.url}/${PATH}/`;

/** The page where directions can be unticked one by one. */
export function manageUrl(key: string, locale: "en" | "ru"): string {
  return `${base(locale)}?key=${encodeURIComponent(key)}`;
}

/**
 * Off the list entirely.
 *
 * The same page with `all=1`, not a different one: the unsubscribe has to be
 * one or two clicks (§8.3), and arriving with the intention already stated
 * is what makes it one.
 */
export function unsubscribeUrl(key: string, locale: "en" | "ru"): string {
  return `${manageUrl(key, locale)}&all=1`;
}
