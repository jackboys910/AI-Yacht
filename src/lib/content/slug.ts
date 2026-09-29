/**
 * Trip and interest addresses.
 *
 * §5 keeps the same Latin address for both languages, so one link works
 * wherever it is shared. The owner types a title in either language and §7.2
 * builds the address from it automatically, with the option to edit it.
 */

/**
 * Cyrillic to Latin, following the table Russian passports use. Without this a
 * Russian-only title would slugify to nothing at all.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e",
  ю: "iu", я: "ia",
};

/** Long enough for a real title, short enough to stay readable in a link. */
const MAX_LENGTH = 60;

/**
 * Turns a title into an address segment: `Grenadines, Nov 12–22 2026` becomes
 * `grenadines-nov-12-22-2026`.
 */
export function slugify(input: string): string {
  const lowered = input.toLowerCase();

  let out = "";
  for (const char of lowered) {
    if (char in CYRILLIC_TO_LATIN) {
      out += CYRILLIC_TO_LATIN[char];
    } else if (/[a-z0-9]/.test(char)) {
      out += char;
    } else {
      // Everything else — spaces, punctuation, dashes of every width, accented
      // letters — becomes a separator and is collapsed below.
      out += "-";
    }
  }

  return out.replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, MAX_LENGTH).replace(/-$/, "");
}

/** True when the address is one we are willing to put in a URL. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= MAX_LENGTH;
}

/**
 * Makes `slug` unique among `taken` by appending `-2`, `-3` and so on.
 *
 * Trip addresses only have to be unique inside their interest, because the
 * interest is part of the path. Interest addresses are unique site-wide, and
 * the caller passes the right set either way.
 */
export function uniqueSlug(slug: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(slug)) return slug;

  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${slug}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
}

/**
 * Addresses the site reserves for its own pages. An interest may not take one
 * of these, or it would shadow a real page.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "assets",
  "manage",
  "privacy",
  "ru",
  "solutions",
  "story",
  "unsubscribe",
]);
