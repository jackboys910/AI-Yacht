/**
 * The channel's feed, read from the edge instead of from the build (С-17).
 *
 * The block of videos at the foot of the home page went missing from the live
 * site while every local build had it, and the code was not the reason. The
 * site is built on a GitHub runner, and YouTube's Atom feed answers a laptop
 * but refuses a datacentre address — not always, which is worse than never:
 * the build of 12 November 07:49 got nothing, the one at 09:49 got six videos.
 * A block that appears or disappears depending on which machine printed the
 * page is a block nobody can show to anyone.
 *
 * So the build asks this endpoint, and this endpoint runs on Cloudflare, where
 * the answer is cached at the edge for an hour. YouTube sees roughly one
 * request an hour from an address it does not mind, instead of two per build
 * from one it does. The direct feed stays in lib/content/youtube.ts as the
 * fallback, for the build where this Worker is the unreachable one.
 *
 * No secret is involved, so no owner is either: the feed is public and so is
 * this. What keeps it from becoming a general-purpose proxy is the pair of
 * patterns below — an id that is not YouTube's own shape never reaches a
 * fetch, and the only address this endpoint can ever ask for is that feed.
 */

import { parseFeed, type ChannelVideo } from "../lib/content/youtube";

const FEED = "https://www.youtube.com/feeds/videos.xml";

/** Channel ids: `UC` and 22 more of YouTube's base64 alphabet. */
const CHANNEL = /^UC[A-Za-z0-9_-]{20,24}$/;

/** Playlist ids vary in length, but every kind starts with a known pair. */
const PLAYLIST = /^(?:PL|UU|FL|LL|OL|RD)[A-Za-z0-9_-]{8,46}$/;

/** What one Atom feed holds; the caller shows as many as it has room for. */
const MAX = 15;

/**
 * An hour.
 *
 * П-15 asks for a new video within a day and the nightly build already
 * provides that, so nothing here needs to be fresher than the page it feeds.
 */
const CACHE_SECONDS = 3600;

const TIMEOUT_MS = 8000;

/**
 * Cloudflare's own cache controls for a subrequest.
 *
 * Declared here rather than installed as `@cloudflare/workers-types`: this is
 * the one Cloudflare-specific option in the whole Worker, and a types package
 * for it would be a dependency to keep in step with the runtime.
 */
type EdgeFetch = RequestInit & {
  cf?: { cacheTtl?: number; cacheEverything?: boolean };
};

const json = (body: unknown, status = 200, cacheSeconds = 0) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheSeconds ? `public, max-age=${cacheSeconds}` : "no-store",
      // The build reads this from a machine that is not this origin.
      "access-control-allow-origin": "*",
    },
  });

export async function videos(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const channel = (searchParams.get("channel_id") ?? "").trim();
  const playlist = (searchParams.get("playlist_id") ?? "").trim();

  const query = CHANNEL.test(channel)
    ? `channel_id=${channel}`
    : PLAYLIST.test(playlist)
      ? `playlist_id=${playlist}`
      : "";
  if (!query) return json({ error: "bad-request", field: "id" }, 400);

  const upstream = await fetch(`${FEED}?${query}`, {
    headers: { accept: "application/atom+xml" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
  } as EdgeFetch);

  if (!upstream.ok) {
    // Logged in full, answered in short: the caller's only decision is whether
    // to go and ask YouTube itself, and this is the log that would tell us the
    // edge has started being refused too.
    console.log(`youtube refused ${query}: HTTP ${upstream.status}`);
    return json({ error: "upstream", status: upstream.status }, 502);
  }

  const list: ChannelVideo[] = parseFeed(await upstream.text(), MAX);
  return json({ videos: list }, 200, CACHE_SECONDS);
}
