#!/usr/bin/env node
/**
 * Т-01: Lighthouse for mobile, on the home page, a direction page and a trip.
 *
 *   node tests/lighthouse.mjs                      # the live site
 *   node tests/lighthouse.mjs --runs 3             # the median of three
 *   node tests/lighthouse.mjs --psi                # measured on Google's machines
 *   node tests/lighthouse.mjs --site http://…      # anything else
 *   node tests/lighthouse.mjs --local              # the export in out/
 *
 * The thresholds are the ones the ТЗ fixes: 85 for performance, 90 for
 * accessibility and for SEO. Best practices is measured and printed without a
 * threshold, because the ТЗ does not set one and a number nobody agreed to is
 * not a pass or a fail.
 *
 * **A local run needs a quiet machine.** Lighthouse slows the processor it
 * measures on by a fixed factor, so whatever else the machine is doing lands
 * on top of the result. Three runs of the same page here gave 98, 86 and 79
 * with identical network timings — the image arrived in 150 ms every time and
 * the paint waited between 115 and 2013 ms for the main thread. That is this
 * laptop, not the site. `--runs` takes the median, and `--psi` asks Google to
 * measure instead, which is the number to put in a report.
 *
 * Lighthouse is run through `npx` rather than added to the project. It pulls
 * in several hundred packages for something that runs by hand a few times a
 * year, and a dependency in `package.json` is a dependency the deploy installs
 * on every build.
 *
 * It is pointed at the **live site** by default on purpose: a local export
 * served by a Node script over plain http has no compression, no cache
 * headers and no CDN, so its numbers say nothing about what a visitor gets.
 * `--local` is there for comparing two builds, not for the criterion.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { loadPlaywright } from "./harness.mjs";
import { serveExport } from "./serve.mjs";

const THRESHOLDS = { performance: 85, accessibility: 90, seo: 90 };
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

const args = process.argv.slice(2);
const local = args.includes("--local");
const siteArg = args.indexOf("--site");
const site = siteArg >= 0 ? args[siteArg + 1].replace(/\/$/, "") : null;
const psi = args.includes("--psi");
const runsArg = args.indexOf("--runs");
/**
 * How many times to measure each page.
 *
 * One run is not a number. Lighthouse simulates a slow connection and a slow
 * processor on top of whatever the machine is actually doing, and two runs of
 * the same page half an hour apart differed here by fourteen points — 91 and
 * 77 — with nothing changed in between. Lighthouse's own advice is the median
 * of several runs, so that is what this reports when asked for more than one.
 */
const runs = runsArg >= 0 ? Math.max(1, Number(args[runsArg + 1]) || 1) : 1;
const out = join(process.cwd(), "lighthouse");

/** A Chrome for Lighthouse to drive: the one Playwright already downloaded. */
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const { playwright } = loadPlaywright();
  return playwright.chromium.executablePath();
}

/**
 * How to start Lighthouse without a shell.
 *
 * Its own `cli/index.js` first, when it is installed: that is one process
 * instead of three and it cannot fail while npx tidies its cache, which on
 * Windows it does while the files are still held.
 *
 * Otherwise npm's `npx-cli.js`, run by this Node — on Windows `npx` is a
 * `.cmd`, which Node refuses to spawn without `shell: true`, and a shell then
 * has to quote paths containing spaces.
 */
function lighthouseCommand() {
  const near = [
    join(dirname(process.execPath), "node_modules/lighthouse/cli/index.js"),
    join(dirname(process.execPath), "../lib/node_modules/lighthouse/cli/index.js"),
    join(process.cwd(), "node_modules/lighthouse/cli/index.js"),
  ].find((one) => existsSync(one));
  if (near) return { command: process.execPath, lead: [near], how: "установленный lighthouse" };

  const npx = [
    join(dirname(process.execPath), "node_modules/npm/bin/npx-cli.js"),
    join(dirname(process.execPath), "../lib/node_modules/npm/bin/npx-cli.js"),
  ].find((one) => existsSync(one));
  if (npx) return { command: process.execPath, lead: [npx, "-y", "lighthouse"], how: "npx lighthouse" };

  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    lead: ["-y", "lighthouse"],
    shell: true,
    how: "npx через оболочку",
  };
}

function run(address, name) {
  // With two output formats Lighthouse treats the path as a base and appends
  // its own extension to each: `home` becomes `home.report.json`.
  const report = join(out, `${name}.report.json`);
  const cli = lighthouseCommand();
  const result = spawnSync(
    cli.command,
    [
      ...cli.lead,
      address,
      "--quiet",
      "--output=json",
      "--output=html",
      `--output-path=${join(out, name)}`,
      // The ТЗ asks for the mobile score, which is Lighthouse's own default
      // preset: a slow 4G connection and a throttled processor.
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
      `--only-categories=${CATEGORIES.join(",")}`,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      env: { ...process.env, CHROME_PATH: chromePath() },
      // A throttled run of a page is slow by design, and a cold npx has to
      // fetch Lighthouse first.
      timeout: 10 * 60 * 1000,
      shell: cli.shell ?? false,
    },
  );

  // The report, not the exit code, is the answer. Lighthouse audits the page
  // and then deletes the throwaway Chrome profile it made, and on Windows that
  // last step fails often enough — a file still held, an antivirus — to throw
  // away a finished measurement over it.
  const finished = existsSync(report);
  if (!finished) {
    const why =
      (result.error ? String(result.error) : "") ||
      (result.stderr || result.stdout || "").split("\n").filter(Boolean).slice(-4).join(" | ");
    return { error: why || `lighthouse вышел с кодом ${result.status}` };
  }

  const parsed = JSON.parse(readFileSync(report, "utf8"));
  const warning =
    result.status !== 0
      ? "замер прошёл, но Lighthouse не смог убрать за собой временный профиль Chrome"
      : null;
  const scores = {};
  for (const key of CATEGORIES) {
    scores[key] = Math.round((parsed.categories[key]?.score ?? 0) * 100);
  }
  return { scores, warning, html: join(out, `${name}.report.html`) };
}

/**
 * The same audit, run by Google instead of by this machine.
 *
 * PageSpeed Insights is Lighthouse on Google's hardware, so the number does
 * not depend on what else is open here — which is the whole difficulty with a
 * local run. Without a key the quota is shared with everyone on the network
 * and runs out; `PSI_KEY` is a free key from the Google Cloud console, and the
 * message says so when the quota refuses.
 *
 * Only public addresses can be measured this way: Google has to be able to
 * open the page.
 */
async function askGoogle(address) {
  const url = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  url.searchParams.set("url", address);
  url.searchParams.set("strategy", "mobile");
  for (const category of CATEGORIES) url.searchParams.append("category", category);
  if (process.env.PSI_KEY) url.searchParams.set("key", process.env.PSI_KEY);

  const response = await fetch(url, { headers: { accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (body.error) {
    const quota = /Quota exceeded/i.test(body.error.message ?? "");
    return {
      error: quota
        ? "квота PageSpeed Insights без ключа исчерпана — заведите бесплатный ключ и передайте его в PSI_KEY"
        : String(body.error.message).slice(0, 160),
    };
  }
  if (!response.ok || !body.lighthouseResult) {
    return { error: `PageSpeed Insights ответил ${response.status}` };
  }

  const scores = {};
  for (const key of CATEGORIES) {
    scores[key] = Math.round((body.lighthouseResult.categories[key]?.score ?? 0) * 100);
  }
  const audits = body.lighthouseResult.audits ?? {};
  return {
    scores,
    note:
      `LCP ${audits["largest-contentful-paint"]?.displayValue ?? "?"}, ` +
      `TBT ${audits["total-blocking-time"]?.displayValue ?? "?"}`,
  };
}

const server = local ? await serveExport({ port: 0 }) : null;
const base = site ?? (local ? server.url : "https://nazarov.net");

// The three pages the plan names: the home page, a direction and a trip.
const page = (path, name) => ({ address: `${base}${path}`, name });
const targets = [page("/", "home"), page("/sailing/", "sailing"), page("/sailing/ai-yacht/", "trip")];

if (!psi) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
}

console.log(`Lighthouse, мобильный профиль: ${base}`);
console.log(psi ? "где считается: PageSpeed Insights (машины Google)" : `как запускается: ${lighthouseCommand().how}`);
console.log(`порог: производительность ${THRESHOLDS.performance}, доступность и SEO ${THRESHOLDS.accessibility}/${THRESHOLDS.seo}\n`);

if (psi) {
  let bad = 0;
  for (const target of targets) {
    process.stdout.write(`${target.address} … `);
    const { scores, error, note } = await askGoogle(target.address);
    if (error) {
      console.log(`НЕ ПОЛУЧИЛОСЬ — ${error}`);
      bad += 1;
      continue;
    }
    const under = Object.entries(THRESHOLDS).filter(([key, least]) => scores[key] < least);
    console.log(
      `производительность ${scores.performance}, доступность ${scores.accessibility}, ` +
        `SEO ${scores.seo}, практики ${scores["best-practices"]}  (${note})` +
        (under.length === 0 ? "  — проходит" : `  — НЕ ПРОХОДИТ: ${under.map(([k, v]) => `${k} < ${v}`).join(", ")}`),
    );
    bad += under.length;
  }
  console.log(bad === 0 ? "\nТ-01: все три страницы проходят порог." : `\nТ-01: ${bad} показателей ниже порога.`);
  process.exit(bad === 0 ? 0 : 1);
}

const median = (numbers) => {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

let failures = 0;
for (const target of targets) {
  console.log(`${target.address}`);
  const taken = [];
  let warning = null;
  let html = null;
  let broke = null;

  for (let attempt = 1; attempt <= runs; attempt += 1) {
    const name = runs === 1 ? target.name : `${target.name}-${attempt}`;
    const result = run(target.address, name);
    if (result.error) {
      broke = result.error;
      break;
    }
    taken.push(result.scores);
    warning = result.warning ?? warning;
    html = result.html;
    if (runs > 1) {
      console.log(`   прогон ${attempt}: производительность ${result.scores.performance}`);
    }
  }

  if (broke || taken.length === 0) {
    console.log(`   НЕ ПОЛУЧИЛОСЬ — ${broke}`);
    failures += 1;
    continue;
  }

  const scores = {};
  for (const key of CATEGORIES) scores[key] = median(taken.map((one) => one[key]));

  const bad = Object.entries(THRESHOLDS).filter(([key, least]) => scores[key] < least);
  console.log(
    `   ${runs > 1 ? "медиана: " : ""}производительность ${scores.performance}, ` +
      `доступность ${scores.accessibility}, SEO ${scores.seo}, практики ${scores["best-practices"]}` +
      (bad.length === 0 ? "  — проходит" : `  — НЕ ПРОХОДИТ: ${bad.map(([k, v]) => `${k} < ${v}`).join(", ")}`),
  );
  if (warning) console.log(`   замечание: ${warning}`);
  if (html) console.log(`   отчёт: ${html}`);
  failures += bad.length;
}

if (server) await server.close();
console.log(failures === 0 ? "\nТ-01: все три страницы проходят порог." : `\nТ-01: ${failures} показателей ниже порога.`);
process.exit(failures === 0 ? 0 : 1);
