/**
 * What the suites are written against (5.4).
 *
 * Every check carries the code of the acceptance criterion it belongs to —
 * П-01, А-07, С-11 and so on — so the report can be read against §15 of the
 * ТЗ and §14 of ТЗ v4 rather than against a list of function names. A
 * criterion no browser can decide (a letter actually arriving, a Facebook
 * preview, a training session) is declared here as unautomatable with the
 * reason, and the report prints it as such instead of quietly leaving a gap.
 *
 * Playwright is used directly, without its test runner: the runner would add
 * a config file, a reporter and a worker model to a project whose checks are
 * two hundred assertions over a static export, and this way the same files
 * run against `out/` and against the live site with one flag.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** The engines the ТЗ names (Т-02). `msedge` drives the installed Edge. */
export const BROWSERS = ["chromium", "firefox", "webkit", "msedge"];

/** 390×844 is the iPhone the ТЗ measures against (С-01); 1440 is the desktop. */
export const PHONE = { width: 390, height: 844 };
export const DESKTOP = { width: 1440, height: 900 };

/** The narrowest width the layout promises to survive (П-15). */
export const WIDTHS = [320, 360, 390, 414, 768, 1024, 1440, 1920];

/**
 * Criteria that cannot be decided from a browser, and why. Printed in the
 * report so the list of what is left to a human is part of the output.
 */
export const BY_HAND = {
  "П-12": "появление нового видео за сутки зависит от канала и ночной сборки",
  "А-05": "загрузка фото с камеры и из галереи — нужен настоящий телефон",
  "Н-05": "придёт ли письмо и в какую папку — отвечает почтовая служба",
  "Н-11": "как письмо выглядит в приложении Gmail — рисует Gmail",
  "Ш-03": "превью рисует краулер Facebook; показывает Sharing Debugger",
  "Ш-06": "события пикселя подтверждаются в Events Manager, а пиксель не настроен",
  "Т-04": "восстановление показывают, а не утверждают (DEPLOY.md §11)",
  "Т-07": "аккаунты оформлены на заказчика — факт об аккаунтах, а не о сайте",
  "О-01": "обучение и его запись",
  "О-02": "смысл критерия в том, что заказчик делает это сам",
  "О-03": "иллюстрированная инструкция — документ (пункт 5.5)",
};

export function loadPlaywright() {
  const playwright = require("playwright");
  const { version } = require("playwright/package.json");
  return { playwright, version };
}

/**
 * Opens a browser. `msedge` is the system Edge rather than a download, which
 * is the point of checking it: it is the browser a visitor on Windows has.
 */
export async function openBrowser(name, { headed = false } = {}) {
  const { playwright } = loadPlaywright();
  if (name === "msedge") {
    return playwright.chromium.launch({ channel: "msedge", headless: !headed });
  }
  if (!playwright[name]) throw new Error(`unknown browser: ${name}`);
  return playwright[name].launch({ headless: !headed });
}

/**
 * A page with the things every suite wants: a viewport, and no requests to
 * Cloudflare's challenge service, which refuses an automated browser anyway
 * and would otherwise leave every form waiting for a token.
 */
export async function openPage(browser, { viewport = DESKTOP, turnstile = true } = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.route("**/challenges.cloudflare.com/**", (route) => route.abort());
  if (turnstile) await stubTurnstile(page);
  return page;
}

/**
 * A Turnstile that answers immediately.
 *
 * Turnstile refuses an automated browser — by design, and it cannot be talked
 * out of it. Without this the forms sit at "checking you are human" forever
 * and nothing past them can be checked at all. What is being checked here is
 * the form, not Cloudflare: the real widget is exercised by a person, and the
 * server's half of it has its own check (Н-12) that a request without a token
 * is refused.
 */
export async function stubTurnstile(page) {
  await page.addInitScript(() => {
    let next = 1;
    window.turnstile = {
      render(host, options) {
        const id = `test-${next++}`;
        host.setAttribute("data-fake-turnstile", id);
        // A tick later, the way the real one answers: a form that reads the
        // token during its own render must still see it arrive.
        setTimeout(() => options.callback("fake-turnstile-token"), 10);
        return id;
      },
      remove() {},
      reset() {},
    };
  });
}

/**
 * Answers one of the site's own endpoints without letting the request leave.
 *
 * The static export has no API behind it, and the live site's API writes to
 * the production database. Both reasons point the same way: the suites assert
 * what the page sends and what it shows, and the Worker's own behaviour is
 * checked separately against its routes.
 *
 * @returns a function returning the request bodies seen so far
 */
export async function captureApi(page, path, body = { ok: true }, status = 200) {
  const seen = [];
  await page.route(`**${path}`, async (route) => {
    const request = route.request();
    try {
      seen.push(request.postDataJSON());
    } catch {
      seen.push(request.postData());
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  return () => seen;
}

/**
 * A form control by its name.
 *
 * Not `[name=…]`: that also matches `<meta name="description">`, and a check
 * that silently waits half a minute for a meta tag to become fillable is a
 * worse outcome than a check that fails.
 */
export function field(page, name) {
  return page
    .locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`)
    .first();
}

/** Fills a field if the form has one, and says whether it did. */
export async function fillIfPresent(page, name, value) {
  const one = field(page, name);
  if ((await one.count()) === 0) return false;
  await one.fill(value);
  return true;
}

/** Third-party addresses that must not be touched before consent (П-16). */
export const TRACKERS = [
  "connect.facebook.net",
  "facebook.com/tr",
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
];

/** Records every request to a tracker, so "none happened" can be asserted. */
export function watchTrackers(page) {
  const hits = [];
  page.on("request", (request) => {
    const url = request.url();
    if (TRACKERS.some((one) => url.includes(one))) hits.push(url);
  });
  return hits;
}

/** The report. One line per check, grouped, with the criterion code first. */
export function createRun({ label = "" } = {}) {
  const results = [];
  let group = "";

  const push = (state, code, title, note) => {
    results.push({ state, code, title, note, group });
    const mark = { ok: "OK  ", fail: "НЕТ ", skip: "– " }[state];
    const tail = note ? `  (${note})` : "";
    console.log(`  ${mark} ${String(code).padEnd(6)} ${title}${tail}`);
  };

  return {
    label,
    results,
    group(name) {
      group = name;
      console.log(`\n${name}`);
    },
    /** The only way a check passes: a condition that is strictly true. */
    check(code, title, condition, note) {
      push(condition === true ? "ok" : "fail", code, title, note);
      return condition === true;
    },
    /** Equality, printed with both sides, because "false" explains nothing. */
    equal(code, title, actual, expected) {
      const same = actual === expected;
      push(same ? "ok" : "fail", code, title, same ? undefined : `получили «${actual}», ждали «${expected}»`);
      return same;
    },
    skip(code, title, why) {
      push("skip", code, title, why);
    },
    failed() {
      return results.filter((one) => one.state === "fail");
    },
  };
}

/** Collects several runs into one verdict and a table by criterion. */
export function summarise(runs) {
  const all = runs.flatMap((run) => run.results.map((one) => ({ ...one, run: run.label })));
  const byCode = new Map();
  for (const one of all) {
    const current = byCode.get(one.code) ?? { ok: 0, fail: 0, skip: 0 };
    current[one.state] += 1;
    byCode.set(one.code, current);
  }

  const failed = all.filter((one) => one.state === "fail");

  console.log("\n================ итог ================");
  console.log(`проверок: ${all.length}  прошло: ${all.filter((o) => o.state === "ok").length}  ` +
    `не прошло: ${failed.length}  пропущено: ${all.filter((o) => o.state === "skip").length}`);

  const codes = [...byCode.keys()].sort((a, b) => String(a).localeCompare(String(b), "ru"));
  console.log("\nпо критериям:");
  for (const code of codes) {
    const { ok, fail, skip } = byCode.get(code);
    const state = fail > 0 ? "НЕ ПРОШЁЛ" : ok > 0 ? "прошёл" : "пропущен";
    console.log(`  ${String(code).padEnd(6)} ${state.padEnd(10)} ${ok} / ${fail} / ${skip}`);
  }

  const hand = Object.keys(BY_HAND).filter((code) => !byCode.has(code));
  if (hand.length > 0) {
    console.log("\nпроверяется человеком:");
    for (const code of hand) console.log(`  ${code.padEnd(6)} ${BY_HAND[code]}`);
  }

  if (failed.length > 0) {
    console.log("\nне прошло:");
    for (const one of failed) {
      console.log(`  ${one.run} · ${one.code} · ${one.title}${one.note ? ` — ${one.note}` : ""}`);
    }
  }

  return failed.length;
}

/** Waits for a condition instead of for a number of milliseconds. */
export async function until(predicate, { timeout = 10000, every = 150 } = {}) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await predicate()) return true;
    if (Date.now() > deadline) return false;
    await new Promise((done) => setTimeout(done, every));
  }
}

/** Is anything wider than the window? The whole of П-15 in one measurement. */
export async function hasSideScroll(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    // One pixel of slack: a fractional layout width is not a broken page.
    return doc.scrollWidth - doc.clientWidth > 1;
  });
}

/** Text of the page, whitespace collapsed, for "does it say" questions. */
export async function pageText(page, selector = "body") {
  return (await page.locator(selector).innerText()).replace(/\s+/g, " ").trim();
}
