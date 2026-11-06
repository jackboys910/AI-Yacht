"use client";

import type { Localized, Person, RouteDay, StoredImage } from "@/lib/content/types";
import type { TripDraft } from "@/lib/firebase/trips";
import {
  Checkbox,
  LocalizedInput,
  LocalizedTextarea,
  NumberInput,
  TextInput,
} from "../fields";
import { useAdmin } from "../i18n";
import { ImageField } from "../image-field";
import { Repeatable } from "../repeatable";
import { OptionalSection, Section } from "./section";

const noText = (): Localized<string> => ({ en: "", ru: "" });

export const blankImage = (): StoredImage => ({
  url: "",
  width: 0,
  height: 0,
  storagePath: "",
  alt: noText(),
});

/**
 * The picture-carrying blocks: the first screen's slider, the day-by-day
 * itinerary, the route map, the gallery and the crew.
 *
 * Every picture is entered as an address until plan item 1.5 brings uploading;
 * the fields, the ordering and the cover choice are already the ones that
 * uploading will fill, so only the source of the URL changes then.
 */

export function TripGallery({
  draft,
  set,
}: {
  draft: TripDraft;
  set: <K extends keyof TripDraft>(key: K, value: TripDraft[K]) => void;
}) {
  const { t } = useAdmin();

  return (
    <Section
      id="block-gallery"
      title={t.tripForm.gallery.title}
      subtitle={t.tripForm.gallery.subtitle}
    >
      <Repeatable
        items={draft.gallery}
        onChange={(gallery) => {
          set("gallery", gallery);
          // The cover points at a position, so shrinking the list must not
          // leave it pointing past the end.
          if (draft.coverIndex >= gallery.length) set("coverIndex", 0);
        }}
        create={blankImage}
        itemLabel={(index) =>
          index === draft.coverIndex
            ? t.tripForm.galleryCover(index + 1)
            : t.tripForm.galleryPhoto(index + 1)
        }
        addLabel={t.tripForm.galleryAdd}
        max={10}
        empty={t.tripForm.galleryEmpty}
        render={(image, update, index) => (
          <>
            <ImageField
              id={`gallery-${index}`}
              label={t.tripForm.photoAddress}
              value={image.url ? image : undefined}
              onChange={(next) => update(next ?? blankImage())}
              placeholder="/assets/hero-catamaran.jpg"
            />
            <LocalizedInput
              id={`gallery-${index}-alt`}
              label={t.tripForm.photoAlt}
              value={image.alt}
              onChange={(alt) => update({ ...image, alt })}
            />
            <Checkbox
              id={`gallery-${index}-cover`}
              label={t.tripForm.makeCover}
              checked={draft.coverIndex === index}
              onChange={(checked) => checked && set("coverIndex", index)}
            />
          </>
        )}
      />
    </Section>
  );
}

export function TripRoute({
  draft,
  set,
}: {
  draft: TripDraft;
  set: <K extends keyof TripDraft>(key: K, value: TripDraft[K]) => void;
}) {
  const { t } = useAdmin();

  return (
    <>
      <OptionalSection
        id="block-route"
        title={t.tripForm.route.title}
        subtitle={t.tripForm.route.subtitle}
        value={draft.route}
        onChange={(value) => set("route", value)}
        create={() => ({ days: [] })}
      >
        {(route, update) => (
          <>
            <LocalizedTextarea
              id="route-intro"
              label={t.tripForm.routeIntro}
              rows={2}
              value={route.intro ?? noText()}
              onChange={(intro) => update({ ...route, intro })}
            />
            <Repeatable
              items={route.days}
              onChange={(days) =>
                // Numbers follow position, so moving a day does not leave the
                // itinerary reading 1, 3, 2.
                update({ ...route, days: days.map((day, i) => ({ ...day, number: i + 1 })) })
              }
              create={(): RouteDay => ({ number: route.days.length + 1, place: noText(), text: noText() })}
              itemLabel={(index) => t.tripForm.day(index + 1)}
              addLabel={t.tripForm.dayAdd}
              empty={t.tripForm.daysEmpty}
              render={(day, updateDay, index) => (
                <>
                  <LocalizedInput
                    id={`day-${index}-date`}
                    label={t.tripForm.dayDate}
                    value={day.date ?? noText()}
                    onChange={(date) => updateDay({ ...day, date })}
                    placeholder="Nov 12"
                    hint={t.tripForm.dayDateHint}
                  />
                  <LocalizedInput
                    id={`day-${index}-place`}
                    label={t.tripForm.dayPlace}
                    value={day.place}
                    onChange={(place) => updateDay({ ...day, place })}
                  />
                  <LocalizedTextarea
                    id={`day-${index}-text`}
                    label={t.tripForm.dayText}
                    rows={3}
                    value={day.text}
                    onChange={(text) => updateDay({ ...day, text })}
                  />
                  <ImageField
                    id={`day-${index}-photo`}
                    label={t.tripForm.dayPhoto}
                    value={day.photo}
                    onChange={(photo) => updateDay({ ...day, photo })}
                  />
                </>
              )}
            />
          </>
        )}
      </OptionalSection>

      <OptionalSection
        id="block-map"
        title={t.tripForm.map.title}
        subtitle={t.tripForm.map.subtitle}
        value={draft.map}
        onChange={(value) => set("map", value)}
        create={() => ({ images: [] })}
      >
        {(map, update) => (
          <>
            <Repeatable
              items={map.images}
              onChange={(images) => update({ ...map, images })}
              create={blankImage}
              itemLabel={(index) => t.tripForm.mapImage(index + 1)}
              addLabel={t.tripForm.mapImageAdd}
              empty={t.tripForm.mapImagesEmpty}
              render={(image, updateImage, index) => (
                <ImageField
                  id={`map-${index}`}
                  label={t.tripForm.mapImageAddress}
                  value={image.url ? image : undefined}
                  onChange={(next) => updateImage(next ?? blankImage())}
                  placeholder="/assets/map-wide.jpg"
                />
              )}
            />
            <LocalizedInput
              id="map-caption"
              label={t.tripForm.mapCaption}
              value={map.caption ?? noText()}
              onChange={(caption) => update({ ...map, caption })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput
                id="map-lat"
                label={t.tripForm.latitude}
                min={-90}
                value={map.latitude}
                onChange={(latitude) => update({ ...map, latitude })}
              />
              <NumberInput
                id="map-lng"
                label={t.tripForm.longitude}
                min={-180}
                value={map.longitude}
                onChange={(longitude) => update({ ...map, longitude })}
              />
            </div>
          </>
        )}
      </OptionalSection>

      <OptionalSection
        id="block-media"
        title={t.tripForm.media.title}
        subtitle={t.tripForm.media.subtitle}
        value={draft.media}
        onChange={(value) => set("media", value)}
        create={() => ({ photos: [], youtubeUrls: [] })}
      >
        {(media, update) => (
          <>
            <Repeatable
              items={media.photos}
              onChange={(photos) => update({ ...media, photos })}
              create={blankImage}
              itemLabel={(index) => t.tripForm.galleryPhoto(index + 1)}
              addLabel={t.tripForm.galleryAdd}
              empty={t.tripForm.mediaPhotosEmpty}
              render={(image, updateImage, index) => (
                <ImageField
                  id={`media-${index}`}
                  label={t.tripForm.photoAddress}
                  value={image.url ? image : undefined}
                  onChange={(next) => updateImage(next ?? blankImage())}
                />
              )}
            />
            <Repeatable
              items={media.youtubeUrls}
              onChange={(youtubeUrls) => update({ ...media, youtubeUrls })}
              create={() => ""}
              itemLabel={(index) => t.tripForm.video(index + 1)}
              addLabel={t.tripForm.videoAdd}
              empty={t.tripForm.videosEmpty}
              render={(url, updateUrl, index) => (
                <TextInput
                  id={`video-${index}`}
                  label={t.tripForm.videoUrl}
                  type="url"
                  value={url}
                  onChange={updateUrl}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              )}
            />
          </>
        )}
      </OptionalSection>
    </>
  );
}

/**
 * The crew, picked from the directory (§7.4) rather than typed in again, so a
 * person's photo and bio are written once and a correction reaches every trip.
 */
export function TripCrew({
  draft,
  set,
  people,
}: {
  draft: TripDraft;
  set: <K extends keyof TripDraft>(key: K, value: TripDraft[K]) => void;
  people: Person[];
}) {
  const { t } = useAdmin();

  const chosen = draft.crewPersonIds
    .map((id) => people.find((person) => person.id === id))
    .filter((person): person is Person => Boolean(person));

  const available = people.filter((person) => !draft.crewPersonIds.includes(person.id));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= chosen.length) return;
    const ids = [...draft.crewPersonIds];
    [ids[from], ids[to]] = [ids[to], ids[from]];
    set("crewPersonIds", ids);
  };

  return (
    <Section
      id="block-crew"
      title={t.tripForm.crew.title}
      subtitle={t.tripForm.crew.subtitle}
    >
      {people.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.tripForm.crewNoDirectory}</p>
      ) : (
        <>
          {chosen.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.tripForm.crewNobody}</p>
          ) : (
            <ul className="space-y-2">
              {chosen.map((person, index) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  {person.photo?.url && (
                    <img
                      src={person.photo.url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {person.name.en || person.name.ru}
                    {person.role.en && (
                      <span className="text-muted-foreground"> — {person.role.en}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <SmallButton
                      label={t.field.up}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      ↑
                    </SmallButton>
                    <SmallButton
                      label={t.field.down}
                      disabled={index === chosen.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      ↓
                    </SmallButton>
                    <SmallButton
                      label={t.field.remove}
                      onClick={() =>
                        set(
                          "crewPersonIds",
                          draft.crewPersonIds.filter((id) => id !== person.id),
                        )
                      }
                    >
                      ✕
                    </SmallButton>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {available.length > 0 && (
            <div>
              <label htmlFor="crew-add" className="block text-sm font-medium">
                {t.tripForm.crewAdd}
              </label>
              <select
                id="crew-add"
                value=""
                onChange={(event) => {
                  if (!event.target.value) return;
                  set("crewPersonIds", [...draft.crewPersonIds, event.target.value]);
                }}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/25"
              >
                <option value="">{t.tripForm.crewChoose}</option>
                {available.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name.en || person.name.ru}
                    {person.role.en ? ` — ${person.role.en}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

function SmallButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-sm transition hover:border-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}
