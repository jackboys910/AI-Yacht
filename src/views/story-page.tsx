import { FamilyStory } from "@/components/family/family-story";
import { Photo } from "@/components/photo";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import { storyCopy } from "@/components/story/story-copy";
import { VideoWall } from "@/components/video/video-wall";
import type { Locale } from "@/i18n/config";
import type { Settings } from "@/lib/content/types";
import { usachevUtkin } from "@/lib/family/usachev-utkin";
import type { ChannelVideo } from "@/lib/content/youtube";
import { DEFAULT_YOUTUBE_CHANNEL } from "@/lib/content/youtube";
import type { SiteChrome } from "./trip-page";

/**
 * `/story/` — the owner's own page (§6.5, П-16).
 *
 * Not the About page, and the difference is the whole reason there are two.
 * About is the community: what it is, who may do what, what it costs. This is
 * the person — and since 27.11.2026 the person's family first: the tree of
 * Yakov's ancestors, the Usachevs and the Utkins, with its timeline, its
 * chapters and the journey on the globe (`components/family`). The tree is
 * drawn from one data file, so the same page can later be made for another
 * family.
 *
 * Under the family comes what was here before: the owner's own text, his
 * photograph, his channel, his links. Everything there except the headings
 * comes from the settings, so the owner writes it himself (§7.7). Nothing
 * there insists on being filled in: a missing photograph, an empty text and
 * an unreachable YouTube all leave a page that still makes sense.
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

        calendarHref={chrome.calendarHref}
        languageHrefs={chrome.languageHrefs}
        active="story"
      />

      <FamilyStory tree={usachevUtkin} locale={locale} />

      <section className="bg-background py-16 sm:py-24">
        <div className="container-narrow">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--gold)] sm:text-xs">
                {c.eyebrow[locale]}
              </p>
              <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">{title}</h2>
              {paragraphs.length === 0 && (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{c.lead[locale]}</p>
              )}
              {paragraphs.map((text, index) => (
                <p
                  key={index}
                  className={`max-w-2xl leading-relaxed text-muted-foreground ${index > 0 ? "mt-5" : "mt-6"}`}
                >
                  {text}
                </p>
              ))}

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
                  className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:border-foreground"
                >
                  {c.subscribe[locale]}
                </a>
              </div>

              {links.length > 0 && (
                <div className="mt-10">
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
              <Photo
                src={photo.thumbUrl || photo.url}
                alt={photo.alt?.[locale] || c.photoAlt[locale]}
                width={photo.width || 800}
                height={photo.height || 1000}
                sizes="(min-width: 1024px) 380px, 92vw"
                className="w-full rounded-2xl border border-border object-cover"
              />
            )}
          </div>
        </div>
      </section>

      <VideoWall videos={videos} locale={locale} channelUrl={channelUrl} />

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}

        calendarHref={chrome.calendarHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
