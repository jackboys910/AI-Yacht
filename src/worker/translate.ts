import { readDocumentAsUser } from "./firestore";
import { bearerOf, isOwner } from "./owner";
import type { Env } from "./env";

/**
 * `/api/translate` — the Russian half of the site, written by a machine.
 *
 * The panel is filled in English only (27.11.2026, plan item 6.9): organizers
 * are English-speaking, and the owner asked for no Russian tabs at all. When a
 * record is saved, the panel sends the English texts whose Russian half is
 * empty here, and writes what comes back into the record together with the
 * rest of it — so the Russian page is a translation from the first build, and
 * the preview shows it straight away.
 *
 * Cloudflare's own Workers AI does the translating, through the `AI` binding
 * in wrangler.jsonc: no key to keep, no account elsewhere, and the free daily
 * allowance is far above what a few trips a week need.
 *
 * Who may call it is decided the way the rest of the panel decides it: the
 * owner, or an organizer naming a trip Firestore lets them read. Anyone else
 * would be spending the site's allowance on their own texts.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const DEFAULT_PROJECT = "nazarov-net";
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

/** A trip form is the largest thing saved: well under these. */
const MAX_TEXTS = 400;
const MAX_CHARS = 60_000;
/** Per request to the model, so its answer stays inside its output limit. */
const BATCH_CHARS = 2_500;

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
/** A plain translation model: worse prose, but it always answers in kind. */
const FALLBACK = "@cf/meta/m2m100-1.2b";

const SYSTEM = [
  "You translate the content of a travel and adventure website — sailing and yachting trips, snowboarding, skydiving, mountaineering — from English into Russian.",
  "Write natural, idiomatic Russian that reads as if written by a native speaker for the same audience: friendly and confident, not bureaucratic.",
  "You receive a JSON array of strings and answer with a JSON object {\"translations\": [...]} holding exactly as many strings, in the same order, each the Russian translation of the string at the same position.",
  "Keep line breaks, punctuation style, emoji, numbers, prices, currencies, dates, times, URLs, e-mail addresses and @handles exactly as they are.",
  "Write place names and people's names the way they are usually written in Russian; transliterate a name that has no established Russian form. Leave brand and boat names in Latin script.",
  "A string that is already Russian, or is only a name, a number or a link, comes back as it is.",
  "Answer with the JSON object only — no notes, no quotes around it, no explanations.",
].join(" ");

interface Ai {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

/** Splits into runs of a size one answer of the model can carry. */
function batches(texts: string[]): string[][] {
  const out: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const text of texts) {
    if (current.length > 0 && size + text.length > BATCH_CHARS) {
      out.push(current);
      current = [];
      size = 0;
    }
    current.push(text);
    size += text.length;
  }
  if (current.length > 0) out.push(current);
  return out;
}

/** The model's answer, wherever in the response it put it. */
function translationsOf(result: unknown): unknown {
  const response = (result as { response?: unknown } | null)?.response;
  if (response && typeof response === "object") return (response as { translations?: unknown }).translations;
  if (typeof response !== "string") return undefined;
  // Some answers arrive as a string holding the JSON, now and then wrapped
  // in a code fence.
  const start = response.indexOf("{");
  const end = response.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  try {
    return (JSON.parse(response.slice(start, end + 1)) as { translations?: unknown }).translations;
  } catch {
    return undefined;
  }
}

async function withModel(ai: Ai, texts: string[]): Promise<string[] | null> {
  const result = await ai.run(MODEL, {
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify(texts) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        type: "object",
        properties: { translations: { type: "array", items: { type: "string" } } },
        required: ["translations"],
      },
    },
    temperature: 0.2,
    max_tokens: 4096,
  });
  const list = translationsOf(result);
  if (!Array.isArray(list) || list.length !== texts.length) return null;
  if (!list.every((item) => typeof item === "string" && item.trim() !== "")) return null;
  return list as string[];
}

async function withFallback(ai: Ai, texts: string[]): Promise<string[]> {
  return Promise.all(
    texts.map(async (text) => {
      const result = (await ai.run(FALLBACK, { text, source_lang: "english", target_lang: "russian" })) as {
        translated_text?: unknown;
      };
      return typeof result?.translated_text === "string" && result.translated_text.trim()
        ? result.translated_text
        : "";
    }),
  );
}

async function translateAll(ai: Ai, texts: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const batch of batches(texts)) {
    let done: string[] | null = null;
    try {
      done = await withModel(ai, batch);
    } catch (error) {
      console.log(`translate: model failed, falling back: ${String(error)}`);
    }
    out.push(...(done ?? (await withFallback(ai, batch))));
  }
  return out;
}

async function allowed(request: Request, env: Env, tripId: string): Promise<boolean> {
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT;
  const idToken = bearerOf(request);
  if (!idToken) return false;
  if (await isOwner(idToken, projectId)) return true;
  // An organizer: allowed for a trip Firestore lets them read, which is
  // their own and nobody else's (firestore.rules, isOrganizerOf).
  if (!ID.test(tripId)) return false;
  try {
    return (await readDocumentAsUser(idToken, projectId, `trips/${tripId}`)) !== null;
  } catch {
    return false;
  }
}

export async function translate(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { texts?: unknown; tripId?: unknown } | null;
  const tripId = typeof body?.tripId === "string" ? body.tripId : "";

  if (!(await allowed(request, env, tripId))) return json({ error: "unauthorized" }, 401);

  const ai = env.AI as Ai | undefined;
  if (!ai) return json({ error: "not-configured" }, 503);

  const texts = Array.isArray(body?.texts) ? body.texts : null;
  if (!texts || !texts.every((text) => typeof text === "string")) return json({ error: "bad-texts" }, 400);
  if (texts.length === 0) return json({ translations: [] });
  if (texts.length > MAX_TEXTS || texts.reduce((sum, text) => sum + text.length, 0) > MAX_CHARS) {
    return json({ error: "too-much" }, 413);
  }

  const translations = await translateAll(ai, texts as string[]);
  return json({ translations });
}
