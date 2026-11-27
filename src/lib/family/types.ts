import type { Locale } from "@/i18n/config";

/**
 * The shape of an ancestry page.
 *
 * Everything the Story page draws — the tree, the timeline beside it, the
 * chapters under it and the journey on the globe — is read from one value of
 * this type. Nothing in the components knows whose family it is. That is the
 * point: the client wants to offer the same page to other families, and a
 * second family should be a second data file, not a second page.
 *
 * Every visible string is given in both languages, because the site has both
 * and a tree that is half-translated reads as a broken page.
 */
export type Text = Record<Locale, string>;

export interface FamilyPhoto {
  src: string;
  width: number;
  height: number;
  alt: Text;
  caption?: Text;
}

export interface Spouse {
  name: Text;
  /** Years, origin, the wedding date — whatever the records give. */
  note?: Text;
}

export interface Person {
  id: string;
  /** The full name, used in the detail card. */
  name: Text;
  /** What fits on a tree card: usually first name and patronymic. */
  short: Text;
  /** Two letters for the portrait when there is no photograph. */
  initials: Text;
  /** "18.01.1901 – April 1942", "c. 1629 – ?", "b. 21.07.1954". */
  life?: Text;
  /** Where the person lived, as the card shows it. */
  place?: Text;
  /** "Yakov's son", "eldest daughter" — one short line under the name. */
  role?: Text;
  spouses?: Spouse[];
  /** Brothers and sisters, as one line. */
  siblings?: Text;
  children?: Text;
  /** What the archive documents say, one fact per entry. */
  notes?: Text[];
  photos?: FamilyPhoto[];
  /** Remembered rather than merely recorded: fell in war. */
  memorial?: boolean;
  /** The person the tree is drawn for — marked out on the card. */
  focus?: boolean;
}

/**
 * One generation: a line of the timeline on the left and its people on the
 * right. `single` rows hold one direct ancestor, and any further ids are
 * brothers and sisters drawn smaller beside them; `pair` rows hold the two
 * family lines side by side, the first under the left heading and the second
 * under the right.
 */
export interface TreeRow {
  id: string;
  kind: "single" | "pair";
  /** Ids into `people`. The ancestor first for `single`; two for `pair`. */
  people: string[];
  /** The label on the timeline: "1901", "1998–2003", "before 1610". */
  year: Text;
  title: Text;
  summary: Text;
  /** Where the mini globe turns to while this row is on screen. */
  placeId: string;
  /** Background tone: older generations sit on older paper. */
  era: "today" | "modern" | "imperial" | "early";
}

/** The longer story under the tree; one per row, under the row's id. */
export interface Chapter {
  rowId: string;
  /** What was happening in the country and the region. */
  world: Text[];
  /** What the family was doing. */
  family: Text[];
}

export interface Place {
  id: string;
  name: Text;
  /** The second name, where a village had two. */
  alias?: Text;
  lng: number;
  lat: number;
  /** The records only suggest it, or the map could not pin it exactly. */
  approximate?: boolean;
  /** Drawn as a place of remembrance rather than a home. */
  memorial?: boolean;
}

export interface Route {
  from: string;
  to: string;
  /** move — a family moving house; link — a marriage between villages;
   *  rocket — the jump across the ocean. */
  kind: "move" | "link" | "rocket";
}

/** One step of the journey on the globe. */
export interface JourneyStage {
  id: string;
  year: Text;
  title: Text;
  text: Text;
  camera: { lng: number; lat: number; zoom: number; pitch?: number; bearing?: number };
  /** Places lit up in this step. */
  places: string[];
  routes?: Route[];
  /** A line drawn through these points — a railway, say. */
  path?: { label: Text; points: [number, number][] };
}

export interface Source {
  label: Text;
  url?: string;
}

export interface FamilyTree {
  hero: {
    eyebrow: Text;
    title: Text;
    lead: Text;
    stats: { value: number; prefix?: string; suffix?: Text; label: Text }[];
  };
  /** Headings over the two columns of `pair` rows. */
  lines: [Text, Text];
  people: Record<string, Person>;
  /** Newest generation first: the page reads from today into the past. */
  rows: TreeRow[];
  chapters: Chapter[];
  places: Place[];
  journey: JourneyStage[];
  /** Small print under the tree: how to read the dates. */
  notes: Text[];
  sources: { archives: Source[]; literature: Source[]; credit: Text };
}
