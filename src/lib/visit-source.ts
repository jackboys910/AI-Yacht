/**
 * Where this visit came from (§7.5).
 *
 * Written onto a subscription, an idea and an application so the owner can
 * tell an ad from a link a friend sent. Three things, in one line, because
 * what it is for is reading in a list rather than being reported on:
 *
 *   /ru/sailing/ · facebook / cpc / winter-2027 · from t.co
 *
 * The page is always there; the campaign tags only when the link carried
 * them; the referrer only when it is another site, since "came from our own
 * home page" is noise. Nothing identifies the person — this is the path, not
 * a profile.
 */
export function visitSource(): string {
  if (typeof window === "undefined") return "";

  const parts: string[] = [window.location.pathname];

  const params = new URLSearchParams(window.location.search);
  const campaign = ["utm_source", "utm_medium", "utm_campaign", "utm_content"]
    .map((key) => params.get(key)?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" / ");
  if (campaign) parts.push(campaign);

  try {
    const referrer = document.referrer;
    if (referrer) {
      const host = new URL(referrer).hostname;
      // Moving between our own pages is not a source.
      if (host && host !== window.location.hostname) parts.push(`from ${host}`);
    }
  } catch {
    // A referrer that is not a URL tells us nothing; the page alone will do.
  }

  return parts.join(" · ").slice(0, 300);
}
