/**
 * Who reads the mail the site sends to the owner.
 *
 * Every form on nazarov.net sends two kinds of letter: one to the person who
 * filled it in, and one to the owner, who has to do something about it. George
 * asked for a copy of the second kind — he keeps the site, and a form that
 * quietly stopped arriving is the kind of failure nobody notices until a trip
 * goes unfilled.
 *
 * Only the owner's letter is copied. A letter to an applicant, an organizer or
 * a new subscriber is that person's own mail: they wrote to the site, not to a
 * mailing list, and a silent third recipient on their receipt is not something
 * they agreed to.
 *
 * The address lives here rather than in each endpoint because there are four
 * places that send to the owner and they must not drift apart. It can be
 * changed without touching code: `EMAILJS_COPY_TO` in the Worker (plain value
 * in wrangler.jsonc, several addresses separated by commas) and
 * `NEXT_PUBLIC_EMAILJS_COPY_TO` for the forms that send from the page. An
 * empty value switches the copies off; an absent one leaves this default.
 */

/** Everyone watching the owner's mail, when nothing says otherwise. */
export const OWNER_WATCHERS: readonly string[] = ["george.jackboys@gmail.com"];

/** `a@b.com, c@d.com` → two addresses. Anything without an `@` is dropped. */
export function parseAddresses(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/[,;\s]+/)
    .map((address) => address.trim())
    .filter((address) => address.includes("@"));
}

/**
 * The owner plus the watchers, each once.
 *
 * Case-insensitive, because `Support@` and `support@` are one mailbox and two
 * identical letters in it look like a bug in the site. The owner comes first:
 * the copy is a copy, and if a send fails partway the owner is the one who
 * must have got it.
 */
export function ownerAddresses(
  owner: string,
  watchers: readonly string[] = OWNER_WATCHERS,
): string[] {
  const seen = new Set<string>();
  const list: string[] = [];

  for (const address of [owner, ...watchers]) {
    const trimmed = (address ?? "").trim();
    if (!trimmed.includes("@")) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(trimmed);
  }

  return list;
}
