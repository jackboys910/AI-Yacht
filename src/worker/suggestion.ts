import {
  buildSuggestionAuthorEmail,
  buildSuggestionOwnerEmail,
  type SuggestionEmailData,
} from "../lib/email/suggestion";
import { readEmailJs, sendEmail } from "./emailjs";
import { createDocument } from "./firestore";
import { readServiceAccount } from "./google-auth";
import { verifyTurnstile } from "./turnstile";
import type { Env } from "./env";

/**
 * `/api/suggestion` — where Suggest an Adventure sends what people write
 * (ТЗ v4, §3).
 *
 * Three things happen here that cannot happen in the page. Turnstile is
 * checked against Cloudflare with a secret, which is the only check a
 * non-browser cannot walk around. The document is written through a service
 * account, so `adventureSuggestions` can stay shut to browsers — it holds
 * email addresses and what people wrote about themselves to be let on a trip.
 * And the two emails go out with the EmailJS private key, which must never
 * reach a bundle.
 *
 * Nothing the visitor typed is trusted for anything but its own length.
 * Lengths are capped rather than rejected: someone who pasted an essay into
 * "budget" should not lose the whole form over it, and the owner can read
 * what survived.
 */

/** Longest each answer may be. Generous for prose, tight for one-liners. */
const LIMITS = {
  title: 160,
  description: 5000,
  place: 200,
  when: 200,
  budget: 200,
  groupSize: 120,
  name: 160,
  email: 320,
  experience: 3000,
  audience: 3000,
  categoryOther: 120,
  link: 500,
  source: 300,
} as const;

const LEVELS = ["beginner", "intermediate", "advanced", "allLevels"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Up to five links, each one a plain http(s) address and nothing else. */
function readLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clip(item, LIMITS.link))
    .filter((item) => /^https?:\/\/\S+$/i.test(item))
    .slice(0, 5);
}

/**
 * An address shaped like an address.
 *
 * Not a validation of whether it exists — nothing short of sending to it
 * tells you that, and the confirmation email is what does. This only stops
 * the obvious nonsense, and a space in the middle.
 */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

interface Submission {
  interestId: string;
  categoryOther?: string;
  title: string;
  description: string;
  place?: string;
  when?: string;
  budget?: string;
  groupSize?: string;
  experienceLevel?: string;
  name: string;
  email: string;
  links: string[];
  experience?: string;
  audience?: string;
  photoLinks: string[];
  locale: "en" | "ru";
  source?: string;
}

/** The body of the request, or the name of the first thing wrong with it. */
function read(raw: unknown): Submission | string {
  if (typeof raw !== "object" || raw === null) return "body";
  const body = raw as Record<string, unknown>;

  const title = clip(body.title, LIMITS.title);
  const description = clip(body.description, LIMITS.description);
  const name = clip(body.name, LIMITS.name);
  const email = clip(body.email, LIMITS.email).toLowerCase();
  const interestId = clip(body.interestId, 200);

  if (!title) return "title";
  if (!interestId) return "interestId";
  if (!description) return "description";
  if (!name) return "name";
  if (!looksLikeEmail(email)) return "email";

  const level = clip(body.experienceLevel, 40);

  return {
    interestId,
    categoryOther: clip(body.categoryOther, LIMITS.categoryOther) || undefined,
    title,
    description,
    place: clip(body.place, LIMITS.place) || undefined,
    when: clip(body.when, LIMITS.when) || undefined,
    budget: clip(body.budget, LIMITS.budget) || undefined,
    groupSize: clip(body.groupSize, LIMITS.groupSize) || undefined,
    experienceLevel: LEVELS.includes(level) ? level : undefined,
    name,
    email,
    links: readLinks(body.links),
    experience: clip(body.experience, LIMITS.experience) || undefined,
    audience: clip(body.audience, LIMITS.audience) || undefined,
    photoLinks: readLinks(body.photoLinks),
    locale: body.locale === "ru" ? "ru" : "en",
    source: clip(body.source, LIMITS.source) || undefined,
  };
}

export async function suggestion(request: Request, env: Env): Promise<Response> {
  const account = readServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
  if (!account) return json({ error: "not-configured" }, 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad-request", field: "body" }, 400);
  }

  const parsed = read(body);
  if (typeof parsed === "string") {
    return json({ error: "bad-request", field: parsed }, 400);
  }

  // Turnstile. Configured and failing is a refusal; not configured at all is
  // a deployment that has not finished, and refusing every idea silently
  // would look exactly like a broken form. The answer says which of the two
  // happened, so "is the spam check actually on?" can be settled by looking
  // rather than by trusting the deploy.
  let checked = false;
  if (env.TURNSTILE_SECRET) {
    const token = clip((body as Record<string, unknown>).turnstileToken, 4000);
    const outcome = await verifyTurnstile(
      env.TURNSTILE_SECRET,
      token,
      request.headers.get("cf-connecting-ip"),
    );
    if (!outcome.ok) {
      console.log(`turnstile refused: ${outcome.codes.join(", ") || "no codes"}`);
      return json({ error: "turnstile" }, 400);
    }
    checked = true;
  }

  const now = new Date().toISOString();
  const id = await createDocument(
    account,
    env.FIREBASE_PROJECT_ID || "nazarov-net",
    "adventureSuggestions",
    {
      status: "new",
      interestId: parsed.interestId,
      categoryOther: parsed.categoryOther,
      title: parsed.title,
      description: parsed.description,
      place: parsed.place,
      when: parsed.when,
      budget: parsed.budget,
      groupSize: parsed.groupSize,
      experienceLevel: parsed.experienceLevel,
      name: parsed.name,
      email: parsed.email,
      links: parsed.links,
      experience: parsed.experience,
      audience: parsed.audience,
      photoLinks: parsed.photoLinks,
      locale: parsed.locale,
      source: parsed.source,
      createdAt: now,
      updatedAt: now,
    },
  );

  // The idea is safe at this point. Everything after it is a courtesy, and a
  // courtesy that fails must not be reported as the idea failing: the person
  // would send it again, and the owner would moderate it twice.
  const mail = readEmailJs(env);
  if (mail) {
    const data: SuggestionEmailData = {
      ...parsed,
      category: clip((body as Record<string, unknown>).categoryLabel, 200) || parsed.interestId,
    };
    const letters: [string, ReturnType<typeof buildSuggestionOwnerEmail>][] = [
      [mail.owner, buildSuggestionOwnerEmail(data)],
      [parsed.email, buildSuggestionAuthorEmail(data)],
    ];

    for (const [to, letter] of letters) {
      try {
        await sendEmail(mail, to, letter);
      } catch (error) {
        console.log(`suggestion ${id}: email to ${to} failed — ${String(error)}`);
      }
    }
  }

  return json({ ok: true, id, checked });
}
