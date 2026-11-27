"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { rebuildSoon } from "@/lib/rebuild";
import {
  blankSettings,
  readSettings,
  saveSettings,
  type SettingsDraft,
} from "@/lib/firebase/settings";
import {
  FormLocaleProvider,
  LocalizedInput,
  LocalizedLines,
  LocalizedTextarea,
  NumberInput,
  PrimaryButton,
  TextInput,
} from "../fields";
import { listProjects, saveProjects } from "@/lib/firebase/projects";
import { failureText, useAdmin } from "../i18n";
import { ImageField } from "../image-field";
import { Repeatable } from "../repeatable";
import { Section } from "../trips/section";
import { WorkProjects, toRows, type ProjectRow } from "./work-projects";

/**
 * §7.7 — everything site-wide the owner may change without a developer
 * (А-15).
 *
 * The screen is built on one rule, and the rule is why it is safe: an empty
 * field means "keep what the site says now", never "make it blank". The
 * pages hold their own text in code and the settings override it field by
 * field and language by language — see `lib/content/site-copy`. So the first
 * save, with forty untouched fields in it, changes nothing at all.
 *
 * The form is deliberately plain. These are values somebody edits twice a
 * year; a screen that tried to be clever about them would cost more to read
 * than the fields are worth.
 */
export function SettingsView() {
  const { locale: panelLocale, t } = useAdmin();
  const c = t.settings;

  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  // The "Our work" projects are their own collection, read and saved beside
  // the settings document — see settings/work-projects.
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  // Filled in English; the Russian is translated on save (plan 6.9).
  const locale: Locale = "en";
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([readSettings(), listProjects()]).then(
      ([settings, work]) => {
        if (!alive) return;
        setDraft(settings);
        setProjects(toRows(work));
      },
      (cause: unknown) => {
        if (!alive) return;
        setDraft(blankSettings());
        setError(failureText(cause, panelLocale, t, c.loadFailed));
      },
    );
    return () => {
      alive = false;
    };
    // The copy is only read in the failure path; changing the panel's
    // language must not re-read the document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!draft) return <p className="text-sm text-muted-foreground">{c.loading}</p>;

  const set = <K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) => {
    setDraft({ ...draft, [key]: value });
    setSaved(false);
  };

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await saveSettings(draft);
      // After the settings, not with them: a project keeps its id, and a
      // failed write here must not leave the page's text saved under one
      // arrangement of projects and the database under another.
      const ids = await saveProjects(projects, removed);
      setProjects((rows) => rows.map((row, index) => ({ ...row, id: ids[index] })));
      setRemoved([]);
      setSaved(true);
      // The site is printed ahead of time, so a saved word is invisible until
      // the next build; А-09 is why the panel asks for one instead of leaving
      // the owner to wonder.
      rebuildSoon();
    } catch (cause) {
      setError(failureText(cause, panelLocale, t, c.saveFailed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormLocaleProvider>
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted-foreground">{c.explain}</p>
        </div>

        <div className="mt-6 space-y-5">
          <Section id="settings-site" title={c.site.title} subtitle={c.site.subtitle}>
            <TextInput
              id="settings-postal"
              label={c.postalAddress}
              value={draft.postalAddress}
              onChange={(value) => set("postalAddress", value)}
              hint={c.postalAddressHint}
            />
            <TextInput
              id="settings-calendly"
              label={c.calendly}
              value={draft.calendlyUrl}
              onChange={(value) => set("calendlyUrl", value)}
              hint={c.calendlyHint}
            />
            <TextInput
              id="settings-channel"
              label={c.channelId}
              value={draft.story.youtubeChannelId ?? ""}
              onChange={(value) =>
                set("story", { ...draft.story, youtubeChannelId: value || undefined })
              }
              hint={c.channelIdHint}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput
                id="settings-going"
                label={c.goingThreshold}
                value={draft.counterThresholds.going}
                onChange={(value) =>
                  set("counterThresholds", {
                    ...draft.counterThresholds,
                    going: value ?? 0,
                  })
                }
                hint={c.thresholdHint}
              />
              <NumberInput
                id="settings-interested"
                label={c.interestedThreshold}
                value={draft.counterThresholds.interested}
                onChange={(value) =>
                  set("counterThresholds", {
                    ...draft.counterThresholds,
                    interested: value ?? 0,
                  })
                }
              />
            </div>
          </Section>

          <Section id="settings-home" title={c.home.title} subtitle={c.home.subtitle}>
            <LocalizedInput
              optional
              id="settings-community-a"
              label={c.homeFields.communityA}
              value={draft.home.communityA}
              onChange={(value) => set("home", { ...draft.home, communityA: value })}
              placeholder={c.defaults.communityA}
            />
            <LocalizedInput
              optional
              id="settings-community-b"
              label={c.homeFields.communityB}
              value={draft.home.communityB}
              onChange={(value) => set("home", { ...draft.home, communityB: value })}
              placeholder={c.defaults.communityB}
            />
            <LocalizedInput
              optional
              id="settings-free"
              label={c.homeFields.free}
              value={draft.home.free}
              onChange={(value) => set("home", { ...draft.home, free: value })}
              placeholder={c.defaults.free}
            />
            <LocalizedInput
              optional
              id="settings-no-fees"
              label={c.homeFields.noFees}
              value={draft.home.noFees}
              onChange={(value) => set("home", { ...draft.home, noFees: value })}
              placeholder={c.defaults.noFees}
            />
            <LocalizedInput
              optional
              id="settings-title-a"
              label={c.homeFields.titleA}
              value={draft.home.titleA}
              onChange={(value) => set("home", { ...draft.home, titleA: value })}
              placeholder={c.defaults.titleA}
            />
            <LocalizedInput
              optional
              id="settings-title-b"
              label={c.homeFields.titleB}
              value={draft.home.titleB}
              onChange={(value) => set("home", { ...draft.home, titleB: value })}
              placeholder={c.defaults.titleB}
            />
          </Section>

          <Section id="settings-about" title={c.about.title} subtitle={c.about.subtitle}>
            <LocalizedInput
              optional
              id="settings-about-eyebrow"
              label={c.aboutFields.eyebrow}
              value={draft.about.heroEyebrow}
              onChange={(value) => set("about", { ...draft.about, heroEyebrow: value })}
            />
            <LocalizedInput
              optional
              id="settings-about-title"
              label={c.aboutFields.title}
              value={draft.about.heroTitle}
              onChange={(value) => set("about", { ...draft.about, heroTitle: value })}
            />
            <LocalizedLines
              optional
              id="settings-about-paragraphs"
              label={c.aboutFields.paragraphs}
              value={draft.about.heroParagraphs}
              onChange={(value) =>
                set("about", { ...draft.about, heroParagraphs: value })
              }
              hint={c.aboutFields.paragraphsHint}
              rows={7}
            />
            <LocalizedInput
              optional
              id="settings-about-closing-title"
              label={c.aboutFields.closingTitle}
              value={draft.about.closingTitle}
              onChange={(value) => set("about", { ...draft.about, closingTitle: value })}
            />
            <LocalizedLines
              optional
              id="settings-about-closing"
              label={c.aboutFields.closingParagraphs}
              value={draft.about.closingParagraphs}
              onChange={(value) =>
                set("about", { ...draft.about, closingParagraphs: value })
              }
              rows={4}
            />
            <LocalizedInput
              optional
              id="settings-about-sign"
              label={c.aboutFields.sign}
              value={draft.about.closingSign}
              onChange={(value) => set("about", { ...draft.about, closingSign: value })}
            />
          </Section>

          <Section id="settings-story" title={c.story.title} subtitle={c.story.subtitle}>
            <LocalizedInput
              optional
              id="settings-story-title"
              label={c.storyFields.title}
              value={draft.story.title}
              onChange={(value) => set("story", { ...draft.story, title: value })}
            />
            <LocalizedTextarea
              optional
              id="settings-story-text"
              label={c.storyFields.text}
              value={draft.story.text}
              onChange={(value) => set("story", { ...draft.story, text: value })}
              hint={c.storyFields.textHint}
              rows={8}
            />
            <ImageField
              id="settings-story-photo"
              label={c.storyFields.photo}
              value={draft.story.photo}
              onChange={(photo) => set("story", { ...draft.story, photo })}
            />
            <div>
              <span className="block text-sm font-medium">{c.storyFields.links}</span>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.storyFields.linksHint}
              </p>
              <div className="mt-3">
                <Repeatable
                  items={draft.story.socialLinks}
                  onChange={(socialLinks) => set("story", { ...draft.story, socialLinks })}
                  create={() => ({ label: "", url: "" })}
                  addLabel={c.storyFields.addLink}
                  itemLabel={(index, item) => item.label || `${c.storyFields.link} ${index + 1}`}
                  render={(item, update, index) => (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextInput
                        id={`settings-link-label-${index}`}
                        label={c.storyFields.linkLabel}
                        value={item.label}
                        onChange={(label) => update({ ...item, label })}
                      />
                      <TextInput
                        id={`settings-link-url-${index}`}
                        label={c.storyFields.linkUrl}
                        value={item.url}
                        onChange={(url) => update({ ...item, url })}
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </Section>

          <Section
            id="settings-solutions"
            title={c.solutions.title}
            subtitle={c.solutions.subtitle}
          >
            <LocalizedInput
              optional
              id="settings-solutions-title"
              label={c.solutionsFields.heroTitle}
              value={draft.solutions.heroTitle}
              onChange={(value) =>
                set("solutions", { ...draft.solutions, heroTitle: value })
              }
            />
            <LocalizedInput
              optional
              id="settings-solutions-subtitle"
              label={c.solutionsFields.heroSubtitle}
              value={draft.solutions.heroSubtitle}
              onChange={(value) =>
                set("solutions", { ...draft.solutions, heroSubtitle: value })
              }
            />
            <div>
              <span className="block text-sm font-medium">
                {c.solutionsFields.services}
              </span>
              <div className="mt-3">
                <Repeatable
                  items={draft.solutions.services}
                  onChange={(services) => set("solutions", { ...draft.solutions, services })}
                  create={() => ({ title: { en: "", ru: "" }, text: { en: "", ru: "" } })}
                  addLabel={c.solutionsFields.addService}
                  itemLabel={(index, item) =>
                    item.title[locale] || `${c.solutionsFields.service} ${index + 1}`
                  }
                  max={8}
                  render={(item, update, index) => (
                    <div className="space-y-4">
                      <LocalizedInput
                        optional
                        id={`settings-service-title-${index}`}
                        label={c.solutionsFields.serviceTitle}
                        value={item.title}
                        onChange={(title) => update({ ...item, title })}
                      />
                      <LocalizedTextarea
                        optional
                        id={`settings-service-text-${index}`}
                        label={c.solutionsFields.serviceText}
                        value={item.text}
                        onChange={(text) => update({ ...item, text })}
                        rows={3}
                      />
                    </div>
                  )}
                />
              </div>
            </div>
            <WorkProjects
              rows={projects}
              onChange={(rows) => {
                setProjects(rows);
                setSaved(false);
              }}
              onRemove={(id) =>
                setRemoved((ids) => (ids.includes(id) ? ids : [...ids, id]))
              }
            />
            <LocalizedLines
              optional
              id="settings-solutions-process"
              label={c.solutionsFields.process}
              value={
                draft.solutions.process.length > 0
                  ? {
                      en: draft.solutions.process.map((step) => step.en),
                      ru: draft.solutions.process.map((step) => step.ru),
                    }
                  : { en: [], ru: [] }
              }
              onChange={(value) => {
                const count = Math.max(value.en.length, value.ru.length);
                set("solutions", {
                  ...draft.solutions,
                  process: Array.from({ length: count }, (_, i) => ({
                    en: value.en[i] ?? "",
                    ru: value.ru[i] ?? "",
                  })),
                });
              }}
              hint={c.solutionsFields.processHint}
              rows={5}
            />
          </Section>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3 pb-10">
          <PrimaryButton onClick={() => void save()} disabled={busy}>
            {busy ? t.field.saving : c.save}
          </PrimaryButton>
          {saved && <span className="text-sm text-[color:var(--teal)]">{c.saved}</span>}
          <span className="text-xs text-muted-foreground">{c.emptyMeansDefault}</span>
        </div>
      </div>
    </FormLocaleProvider>
  );
}
