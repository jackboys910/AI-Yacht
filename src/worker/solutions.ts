import { isProjectType } from "../lib/content/solutions";
import {
  buildSolutionsOwnerEmail,
  buildSolutionsReceiptEmail,
  type SolutionsEmailData,
} from "../lib/email/solutions";
import { ownerCopies, readEmailJs, sendEmail } from "./emailjs";
import { createDocument } from "./firestore";
import { readServiceAccount } from "./google-auth";
import { verifyTurnstile } from "./turnstile";
import type { Env } from "./env";

/**
 * `/api/solutions` — "Tell us about your project" (§6.6, П-17, А-17).
 *
 * §6.6 asks for two things from one submission: the enquiry saved where the
 * owner can work through it, and a letter to support@ctmass.com. Saving is
 * why this is a Worker endpoint rather than a send from the page —
 * `solutionsInquiries` holds a name, an address and a phone number for every
 * business that ever asked for a quote, so no browser may read or write it,
 * and the write happens here through a service account.
 *
 * The order is deliberate: the record first, the letters after. A letter that
 * fails must not be reported as the enquiry failing, because the answer to
 * that is to send it again — and then the same project is quoted twice.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const DEFAULT_PROJECT = "nazarov-net";

const LIMITS = {
  name: 160,
  email: 320,
  phone: 60,
  message: 4000,
  source: 300,
} as const;

const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

interface Submission {
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  message: string;
  locale: "en" | "ru";
  source?: string;
}

/** The body, or the name of the first thing wrong with it. */
function read(raw: unknown): Submission | string {
  if (typeof raw !== "object" || raw === null) return "body";
  const body = raw as Record<string, unknown>;

  const name = clip(body.name, LIMITS.name);
  const email = clip(body.email, LIMITS.email).toLowerCase();
  const projectType = clip(body.projectType, 40);
  const message = clip(body.message, LIMITS.message);

  if (!name) return "name";
  if (!looksLikeEmail(email)) return "email";
  // Checked against the list rather than merely being non-empty: the value
  // is shown back to the owner as a label, and an unknown id would reach the
  // panel as the raw word the request happened to carry.
  if (!isProjectType(projectType)) return "projectType";
  if (!message) return "message";

  return {
    name,
    email,
    phone: clip(body.phone, LIMITS.phone) || undefined,
    projectType,
    message,
    locale: body.locale === "ru" ? "ru" : "en",
    source: clip(body.source, LIMITS.source) || undefined,
  };
}

export async function solutions(request: Request, env: Env): Promise<Response> {
  const account = readServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
  if (!account) return json({ error: "not-configured" }, 503);

  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT;

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

  let checked = false;
  if (env.TURNSTILE_SECRET) {
    const token = clip((body as Record<string, unknown>).turnstileToken, 4000);
    const outcome = await verifyTurnstile(
      env.TURNSTILE_SECRET,
      token,
      request.headers.get("cf-connecting-ip"),
    );
    if (!outcome.ok) {
      console.log(
        `turnstile refused a solutions enquiry: ${outcome.codes.join(", ") || "no codes"}`,
      );
      return json({ error: "turnstile" }, 400);
    }
    checked = true;
  }

  const now = new Date().toISOString();
  const id = await createDocument(account, projectId, "solutionsInquiries", {
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    projectType: parsed.projectType,
    message: parsed.message,
    locale: parsed.locale,
    source: parsed.source,
    handled: false,
    createdAt: now,
  });

  const mail = readEmailJs(env);
  let letters = 0;

  if (mail) {
    const data: SolutionsEmailData = { ...parsed };
    const studio = buildSolutionsOwnerEmail(data);
    const letterList: [string, typeof studio][] = [
      ...ownerCopies(mail).map((to) => [to, studio] as [string, typeof studio]),
      [parsed.email, buildSolutionsReceiptEmail(data)],
    ];

    for (const [to, letter] of letterList) {
      try {
        await sendEmail(mail, to, letter);
        letters += 1;
      } catch (error) {
        console.log(`solutions enquiry ${id}: email to ${to} failed — ${String(error)}`);
      }
    }
  }

  return json({ ok: true, id, checked, letters });
}
