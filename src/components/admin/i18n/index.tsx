"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { defaultLocale, localeLabels, locales, type Locale } from "@/i18n/config";
import { LocalizedError, detailOf, isPermissionDenied } from "@/lib/localized-error";
import EN, { type AdminCopy } from "./copy-en";
import RU from "./copy-ru";

/**
 * The language the admin panel speaks (ТЗ v4, §6, criterion С-13).
 *
 * English by default, because that is the site's default and the owner asked
 * why the panel was Russian-only when the site is not. The choice is remembered
 * per browser, which is the right scope: it belongs to whoever is looking at
 * the panel rather than to the site, and item 2.6 hands the panel to organizers
 * who may well not read Russian at all.
 *
 * This is deliberately *not* the same switch as the EN/RU tabs inside a form.
 * Those pick which language of a trip's text is being typed, and a trip has to
 * be filled in for both whatever language the buttons around it are in (А-03).
 * Merging them would mean a Russian owner could not reach the English fields
 * without putting the whole panel into English, so they stay apart: the panel's
 * language lives in the sidebar, the content's language above the fields.
 */

const KEY = "nazarov.admin.locale";

const COPY: Record<Locale, AdminCopy> = { en: EN, ru: RU };

function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * The remembered choice, as an external store rather than as component state.
 *
 * It has to be, because of where the value comes from. These pages are
 * prerendered in Node, so the first thing React draws on a Russian owner's
 * screen is the English markup from the build; the stored choice only exists in
 * the browser. Reading it during the first render would make the markup
 * disagree with what React is hydrating, and reading it in an effect would set
 * state from inside an effect and cascade a second render before the first has
 * painted. `useSyncExternalStore` is the one path that does neither: React
 * hydrates against `serverSnapshot`, then adopts `snapshot` on its own.
 */
let current: Locale | null = null;
const listeners = new Set<() => void>();

function read(): Locale {
  try {
    const stored = localStorage.getItem(KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Private browsing or blocked storage: English, and the switch still works.
  }
  return defaultLocale;
}

function snapshot(): Locale {
  // Cached: `getSnapshot` is called on every render and has to return the same
  // value until something actually changes.
  if (current === null) current = read();
  return current;
}

function serverSnapshot(): Locale {
  return defaultLocale;
}

function announce(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Two tabs of the panel — one of which is how you compare the languages —
  // should not disagree about which language it is in. `storage` fires only in
  // the other tabs, so this cannot loop.
  const fromAnotherTab = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    current = isLocale(event.newValue) ? event.newValue : defaultLocale;
    announce();
  };
  window.addEventListener("storage", fromAnotherTab);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", fromAnotherTab);
  };
}

function remember(next: Locale): void {
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // The choice holds for this visit even when it cannot be remembered.
  }
  announce();
}

interface AdminLanguage {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: AdminCopy;
}

const AdminLanguageContext = createContext<AdminLanguage>({
  locale: defaultLocale,
  setLocale: () => {},
  t: COPY[defaultLocale],
});

/** The panel's language, its words, and the way to change it. */
export const useAdmin = () => useContext(AdminLanguageContext);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  // The layout and the page metadata cannot know the language: both are server
  // components rendered at build time. So both are corrected here. `lang` is
  // what a screen reader and the spell-checker in forty text fields go by, and
  // the title is what the browser tab and a bookmark show.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = COPY[locale].shell.documentTitle;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => remember(next), []);

  const value = useMemo(
    () => ({ locale, setLocale, t: COPY[locale] }),
    [locale, setLocale],
  );

  return (
    <AdminLanguageContext.Provider value={value}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

/**
 * The panel's language switch.
 *
 * Labelled rather than bare. Two EN/RU pairs on one screen — this one and the
 * content tabs over the fields — would otherwise be indistinguishable, and
 * pressing the wrong one halfway through a trip form is a confusing thing to
 * undo.
 */
export function PanelLanguage({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { locale, setLocale, t } = useAdmin();

  const dark = tone === "dark";

  return (
    <div className={dark ? "px-3" : ""}>
      <span
        className={`block text-[10px] uppercase tracking-[0.16em] ${
          dark ? "text-white/40" : "text-muted-foreground"
        }`}
      >
        {t.shell.interface}
      </span>
      <div
        role="group"
        aria-label={t.shell.interfaceLanguage}
        className={`mt-1.5 inline-flex h-8 items-stretch rounded-full border p-[3px] text-xs font-semibold tracking-[0.08em] ${
          dark ? "border-white/20" : "border-border"
        }`}
      >
        {locales.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={option === locale}
            className={`inline-flex items-center rounded-full px-3 leading-none transition ${
              option === locale
                ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"
                : dark
                  ? "text-white/60 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {localeLabels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * What to show the owner when something failed.
 *
 * Three kinds of failure reach the panel and each needs different handling. A
 * `LocalizedError` is a rule of ours that was broken, and it already knows how
 * to say so in both languages. A permission error is Firestore refusing us,
 * where the technical text says nothing useful and the cause is nearly always
 * the rules or the owners list. Anything else is a genuine surprise, and its
 * text is worth showing even in English, because hiding it would leave no way
 * to find out what happened.
 */
export function failureText(
  error: unknown,
  locale: Locale,
  t: AdminCopy,
  wrap: (detail: string) => string,
): string {
  if (error instanceof LocalizedError) return error.text[locale];
  return wrap(isPermissionDenied(error) ? t.error.permissionDenied : detailOf(error));
}

export type { AdminCopy };
