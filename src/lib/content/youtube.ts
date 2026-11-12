/**
 * The channel's videos, read at build time (С-17, plan item 2.11).
 *
 * Through YouTube's own Atom feeds rather than the Data API, and that is a
 * deliberate trade. The feeds need no key, no quota and no account: nothing
 * to put in a secret, nothing to expire in a year, nothing to stop the site
 * building on somebody else's machine. What they cost is depth — fifteen
 * entries, no view counts, no durations — and the block at the foot of the
 * home page wants none of that.
 *
 * Read during `next build`, so a new video appears with the next build. The
 * nightly rebuild makes that "within a day", which is what П-15 of v3 asks
 * for.
 *
 * There are two ways to the same feed, and the order matters. First the site's
 * own Worker, which fetches it from Cloudflare and keeps the answer at the
 * edge for an hour; only then YouTube directly. The reason is in
 * src/worker/videos.ts: the feed answers a laptop and refuses a build runner's
 * address often enough that the block went missing from the live site while
 * every local build had it.
 *
 * Nothing here throws. YouTube being slow or unreachable must cost the site
 * its video block and not its deploy — an empty list renders nothing at all.
 */

import { siteConfig } from "../site";

export interface ChannelVideo {
  id: string;
  title: string;
  /** ISO date, for ordering and for the caption. */
  publishedAt: string;
  thumbnail: string;
  url: string;
}

const FEED = "https://www.youtube.com/feeds/videos.xml";

/** The same feed, asked of the site's own Worker. */
const PROXY = `${siteConfig.url}/api/videos`;

/** How long to wait before deciding the feed is not coming. */
const TIMEOUT_MS = 8000;

/** The Worker is one hop closer and answers from a cache, so it gets less. */
const PROXY_TIMEOUT_MS = 5000;

/**
 * Tries at the direct feed before this build gives up on the block.
 *
 * Two, not five: a refusal is usually about the address rather than the
 * moment, and a build should not spend a minute finding that out.
 */
const DIRECT_ATTEMPTS = 2;

/**
 * The channel behind the site, when nobody has said otherwise.
 *
 * `settings.story.youtubeChannelId` overrides it; the screen that writes
 * that setting arrives with plan item 4.3, and until then this is what makes
 * the block appear at all. It is the id behind `@captain_yasha`, resolved
 * once rather than looked up on every build: the handle is not in the feed
 * addresses, and scraping a channel page during a deploy is a dependency
 * nobody needs.
 */
export const DEFAULT_YOUTUBE_CHANNEL = "UCQxhEyWstcDcjgaYuyFmdhA";

const unescapeXml = (value: string) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/**
 * The entries of an Atom feed, without an XML parser.
 *
 * The shape is YouTube's and it is rigid: four fields, each on its own line,
 * no namespaces to resolve and no attributes to walk. A parser dependency
 * for this would be a parser dependency to keep up to date.
 *
 * Exported because the Worker parses the same feed, and two parsers for one
 * format is one parser too many.
 */
export function parseFeed(xml: string, limit: number): ChannelVideo[] {
  const videos: ChannelVideo[] = [];

  for (const entry of xml.split("<entry>").slice(1)) {
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry)?.[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(entry)?.[1];
    const published = /<published>([^<]+)<\/published>/.exec(entry)?.[1];
    const thumbnail = /<media:thumbnail url="([^"]+)"/.exec(entry)?.[1];
    if (!id || !title) continue;

    videos.push({
      id,
      title: unescapeXml(title).trim(),
      publishedAt: published ?? "",
      // The feed offers hqdefault; mqdefault is a quarter of the weight and
      // the block never shows one larger than 480 wide.
      thumbnail: thumbnail ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`,
    });

    if (videos.length >= limit) break;
  }

  return videos;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const reason = (cause: unknown) =>
  cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);

/**
 * One video as the Worker describes it.
 *
 * Checked rather than trusted: this arrives over the network, and a shape that
 * surprised the markup would show up as a broken thumbnail on the home page
 * rather than as anything anybody would see in a log.
 */
function isVideo(value: unknown): value is ChannelVideo {
  if (!value || typeof value !== "object") return false;
  const video = value as Record<string, unknown>;
  return (
    typeof video.id === "string" &&
    video.id !== "" &&
    typeof video.title === "string" &&
    typeof video.publishedAt === "string" &&
    typeof video.url === "string" &&
    video.url.startsWith("https://www.youtube.com/watch?v=") &&
    typeof video.thumbnail === "string" &&
    video.thumbnail.startsWith("https://")
  );
}

/** The feed as the site's own Worker reads it, from an address YouTube likes. */
async function readProxied(query: string, limit: number): Promise<ChannelVideo[]> {
  try {
    const response = await fetch(`${PROXY}?${query}`, {
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Expected on the one build that first carries this endpoint: the pages
      // and the Worker go live together, after the build that printed them.
      console.warn(
        `[youtube] the site's own feed endpoint refused ${query}: HTTP ${response.status}`,
      );
      return [];
    }

    const body: unknown = await response.json();
    const list = (body as { videos?: unknown }).videos;
    if (!Array.isArray(list)) {
      console.warn(`[youtube] the site's own feed endpoint answered ${query} with no list`);
      return [];
    }
    return list.filter(isVideo).slice(0, limit);
  } catch (cause) {
    console.warn(
      `[youtube] the site's own feed endpoint is unreachable for ${query} — ${reason(cause)}`,
    );
    return [];
  }
}

/** One attempt at the feed, straight from YouTube. */
async function readDirect(query: string, limit: number): Promise<ChannelVideo[]> {
  const started = Date.now();
  const took = () => `${Date.now() - started}ms`;

  try {
    const response = await fetch(`${FEED}?${query}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      // Said out loud, because a silent empty list is exactly how the block
      // went missing from the live site while every local build had it.
      console.warn(`[youtube] ${query} refused: HTTP ${response.status} after ${took()}`);
      return [];
    }

    const videos = parseFeed(await response.text(), limit);
    if (videos.length === 0) {
      console.warn(`[youtube] ${query} answered with no entries after ${took()}`);
    }
    return videos;
  } catch (cause) {
    // Offline, blocked, slow, or a channel that no longer exists. The page
    // is built either way — but not silently.
    console.warn(`[youtube] ${query} failed after ${took()} — ${reason(cause)}`);
    return [];
  }
}

async function readFeed(query: string, limit: number): Promise<ChannelVideo[]> {
  const proxied = await readProxied(query, limit);
  if (proxied.length > 0) return proxied;

  for (let attempt = 1; attempt <= DIRECT_ATTEMPTS; attempt += 1) {
    const videos = await readDirect(query, limit);
    if (videos.length > 0) return videos;
    if (attempt < DIRECT_ATTEMPTS) await wait(1000 * attempt);
  }

  return [];
}

/**
 * One read per feed per rendering process.
 *
 * The English and the Russian home page ask for the same channel, and each
 * used to pay for its own round trip — or, on a build YouTube is refusing, for
 * its own set of failed ones. Per process rather than per build, because
 * `next build` renders the pages across a pool of workers and two pages can
 * land in two of them: the ceiling is one read per worker, not one in total.
 * Not in `next dev` at all, for the same reason `getSiteContent` caches only
 * in a real build: a video posted while the dev server is running should still
 * turn up on a reload.
 *
 * `process` is read inside the function rather than at module load, because
 * the Worker imports this file for its parser and there is no `process` there.
 */
const reads = new Map<string, Promise<ChannelVideo[]>>();

function feed(query: string, limit: number): Promise<ChannelVideo[]> {
  const building =
    typeof process !== "undefined" && process.env.NODE_ENV === "production";
  if (!building) return readFeed(query, limit);

  const key = `${query}|${limit}`;
  let pending = reads.get(key);
  if (!pending) {
    pending = readFeed(query, limit);
    reads.set(key, pending);
  }
  return pending;
}

/** The newest videos of a channel. */
export function readChannelVideos(
  channelId: string | undefined,
  limit = 6,
): Promise<ChannelVideo[]> {
  const id = channelId?.trim() || DEFAULT_YOUTUBE_CHANNEL;
  return id ? feed(`channel_id=${encodeURIComponent(id)}`, limit) : Promise.resolve([]);
}

/** The newest videos of one playlist — a direction's own, where it has one. */
export function readPlaylistVideos(
  playlistId: string | undefined,
  limit = 6,
): Promise<ChannelVideo[]> {
  const id = playlistId?.trim();
  return id ? feed(`playlist_id=${encodeURIComponent(id)}`, limit) : Promise.resolve([]);
}
