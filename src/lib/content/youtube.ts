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
 * Nothing here throws. YouTube being slow or unreachable must cost the site
 * its video block and not its deploy — an empty list renders nothing at all.
 */

export interface ChannelVideo {
  id: string;
  title: string;
  /** ISO date, for ordering and for the caption. */
  publishedAt: string;
  thumbnail: string;
  url: string;
}

const FEED = "https://www.youtube.com/feeds/videos.xml";

/** How long to wait before deciding the feed is not coming. */
const TIMEOUT_MS = 8000;

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
 */
function parseFeed(xml: string, limit: number): ChannelVideo[] {
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

async function readFeed(query: string, limit: number): Promise<ChannelVideo[]> {
  try {
    const response = await fetch(`${FEED}?${query}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return [];
    return parseFeed(await response.text(), limit);
  } catch {
    // Offline, blocked, slow, or a channel that no longer exists. The page
    // is built either way.
    return [];
  }
}

/** The newest videos of a channel. */
export function readChannelVideos(
  channelId: string | undefined,
  limit = 6,
): Promise<ChannelVideo[]> {
  const id = channelId?.trim() || DEFAULT_YOUTUBE_CHANNEL;
  return id ? readFeed(`channel_id=${encodeURIComponent(id)}`, limit) : Promise.resolve([]);
}

/** The newest videos of one playlist — a direction's own, where it has one. */
export function readPlaylistVideos(
  playlistId: string | undefined,
  limit = 6,
): Promise<ChannelVideo[]> {
  const id = playlistId?.trim();
  return id ? readFeed(`playlist_id=${encodeURIComponent(id)}`, limit) : Promise.resolve([]);
}
