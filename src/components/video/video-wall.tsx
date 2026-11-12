"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { ChannelVideo } from "@/lib/content/youtube";

const COPY = {
  kicker: { en: "From the channel", ru: "С канала" },
  heading: { en: "What it actually looks like", ru: "Как это выглядит на самом деле" },
  // Deliberately not "filmed on the trips": the block shows the channel's
  // latest, and the channel has more on it than trips. A line that promised
  // otherwise would be wrong the first time something else was posted.
  text: {
    en: "Shot by hand, on the way — no drone operator, no script.",
    ru: "Снято на ходу и своими руками — без оператора с дроном и без сценария.",
  },
  all: { en: "The whole channel", ru: "Весь канал" },
  play: { en: "Play", ru: "Смотреть" },
  onYouTube: { en: "Watch on YouTube", ru: "Смотреть на YouTube" },
} as const;

/**
 * The videos at the foot of the home page, and on a tab that has a playlist
 * (С-17, plan item 2.11).
 *
 * Thumbnails, not embeds. Six YouTube players on one page is two megabytes
 * of someone else's JavaScript and six sets of cookies for a block most
 * visitors scroll past; the player is loaded for the one video somebody
 * actually pressed, and not one byte of YouTube is fetched before that press.
 *
 * The player comes from `youtube.com` rather than `youtube-nocookie.com`,
 * which is a reversal. On the cookie-free domain YouTube has no way to tell a
 * person from a scraper, so on some addresses — a VPN, a mobile operator's
 * shared one — it answers the embed with "Sign in to confirm you are not a
 * bot" and plays nothing. On the ordinary domain a viewer who is signed in to
 * YouTube in that browser is simply recognised. The privacy that mattered is
 * kept by the facade: nothing is loaded, and no cookie is set, until somebody
 * deliberately presses play on one video.
 *
 * That check can still appear — it is YouTube's call and it depends on the
 * address the viewer is coming from — so every card carries a plain link to
 * the video as well. When the player refuses, the way out is one click, not a
 * dead rectangle.
 *
 * The thumbnail is a link as well as a button: a middle click, a long press
 * and a right-click "open in new tab" all do what they look like they do,
 * which a `<button>` would not.
 */
export function VideoWall({
  videos,
  locale,
  channelUrl,
}: {
  videos: ChannelVideo[];
  locale: Locale;
  /** "The whole channel" — left out when there is no channel to point at. */
  channelUrl?: string;
}) {
  const [playing, setPlaying] = useState<string | null>(null);

  // A feed that could not be read renders nothing rather than an empty
  // heading: the block is the videos, not the words above them.
  if (videos.length === 0) return null;

  return (
    <section className="bg-[color:var(--muted)] py-16 sm:py-24">
      <div className="container-narrow">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--teal)]">
              {COPY.kicker[locale]}
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              {COPY.heading[locale]}
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">{COPY.text[locale]}</p>
          </div>

          {channelUrl && (
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener"
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-foreground"
            >
              {COPY.all[locale]}
            </a>
          )}
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <li key={video.id}>
              <article className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-video bg-[color:var(--primary)]">
                  {playing === video.id ? (
                    <iframe
                      // Autoplay because the press that put it here was the
                      // press that means "play".
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener"
                      onClick={(event) => {
                        // Only a plain left click plays it here; everything
                        // else is somebody asking for YouTube itself.
                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                          return;
                        }
                        event.preventDefault();
                        setPlaying(video.id);
                      }}
                      className="group absolute inset-0 block"
                      aria-label={`${COPY.play[locale]}: ${video.title}`}
                    >
                      <img
                        src={video.thumbnail}
                        alt=""
                        loading="lazy"
                        width={480}
                        height={360}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 grid place-items-center bg-[color:var(--primary)]/25 transition group-hover:bg-[color:var(--primary)]/10"
                      >
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--gold)] text-xl text-[color:var(--gold-foreground)] shadow-lg transition group-hover:scale-110">
                          ▶
                        </span>
                      </span>
                    </a>
                  )}
                </div>

                <div className="px-4 py-3.5">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</h3>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener"
                    className="mt-1.5 inline-block text-xs text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
                  >
                    {COPY.onYouTube[locale]}
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
