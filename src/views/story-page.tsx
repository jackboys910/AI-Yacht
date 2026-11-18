import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import { storyCopy } from "@/components/story/story-copy";
import { VideoWall } from "@/components/video/video-wall";
import type { Locale } from "@/i18n/config";
import type { Settings } from "@/lib/content/types";
import type { ChannelVideo } from "@/lib/content/youtube";
import { DEFAULT_YOUTUBE_CHANNEL } from "@/lib/content/youtube";
import type { SiteChrome } from "./trip-page";

/**
 * `/story/` — the owner's own page (§6.5, П-16).
 *
 * Not the About page, and the difference is the whole reason there are two.
 * About is the community: what it is, who may do what, what it costs. This is
 * the person — his text, his photograph, his channel, his links — and ТЗ v3
 * §2 renamed "Обо мне" to this address precisely so the two stop competing.
 *
 * Everything on it except the headings comes from the settings, so the owner
 * writes this page himself (§7.7). Nothing here insists on being filled in: a
 * missing photograph, an empty text and an unreachable YouTube all leave a
 * page that still makes sense, because the page would otherwise go down with
 * whichever of them is missing on the day.
 *
 * The videos refresh themselves — П-16 asks for a new one to appear within a
 * day, and the nightly rebuild is what does it.
 */
export function StoryPage({
  locale,
  settings,
  videos,
  chrome,
}: {
  locale: Locale;
  settings: Settings | null;
  /** The channel's latest, read at build time. Empty hides the block. */
  videos: ChannelVideo[];
  chrome: SiteChrome;
}) {
  const c = storyCopy;
  const story = settings?.story;

  const title = story?.title[locale]?.trim() || c.title[locale];
  const paragraphs = (story?.text[locale] ?? "")
    .split(/\n{2,}/)
    .map((one) => one.trim())
    .filter(Boolean);
  const photo = story?.photo;
  const channelId = story?.youtubeChannelId?.trim() || DEFAULT_YOUTUBE_CHANNEL;
  const channelUrl = `https://www.youtube.com/channel/${channelId}`;
  const links = (story?.socialLinks ?? []).filter(
    (link) => link.url.trim().length > 0 && link.label.trim().length > 0,
  );

  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
        active="story"
      />

      <section className="relative isolate overflow-hidden bg-primary pb-16 pt-28 text-white sm:pb-24 sm:pt-36">
        {photo?.url && (
          <img
            src={photo.url}
            alt={photo.alt?.[locale] || c.photoAlt[locale]}
            width={photo.width || 1280}
            height={photo.height || 960}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/85 to-primary" />

        <div className="container-narrow relative max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--gold)] sm:text-xs">
            {c.eyebrow[locale]}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-6xl">{title}</h1>
          {paragraphs.length === 0 && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
              {c.lead[locale]}
            </p>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener"
              className="rounded-full bg-[color:var(--gold)] px-6 py-3 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95"
            >
              {c.watch[locale]}
            </a>
            {/* The one link that opens YouTube with the subscription dialog
                already up; without the parameter it is just the channel
                again, which is the button beside it. */}
            <a
              href={`${channelUrl}?sub_confirmation=1`}
              target="_blank"
              rel="noopener"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:border-white"
            >
              {c.subscribe[locale]}
            </a>
          </div>
        </div>
      </section>

      {(paragraphs.length > 0 || photo?.url || links.length > 0) && (
        <section className="bg-background py-16 sm:py-24">
          <div className="container-narrow">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              <div>
                {paragraphs.map((text, index) => (
                  <p
                    key={index}
                    className={`max-w-2xl leading-relaxed text-muted-foreground ${
                      index > 0 ? "mt-5" : ""
                    }`}
                  >
                    {text}
                  </p>
                ))}

                {links.length > 0 && (
                  <div className={paragraphs.length > 0 ? "mt-10" : ""}>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {c.links[locale]}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-3">
                      {links.map((link) => (
                        <li key={`${link.label}-${link.url}`}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:border-foreground"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {photo?.url && (
                <img
                  src={photo.thumbUrl || photo.url}
                  alt={photo.alt?.[locale] || c.photoAlt[locale]}
                  width={photo.width || 800}
                  height={photo.height || 1000}
                  className="w-full rounded-2xl border border-border object-cover"
                />
              )}
            </div>
          </div>
        </section>
      )}

      <VideoWall videos={videos} locale={locale} channelUrl={channelUrl} />

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
